import {pick} from 'lodash';
import {container} from 'tsyringe';
import {FileBackendMount} from '../../../definitions/fileBackend';
import {CleanupMountResolvedEntriesJobParams, Job} from '../../../definitions/job';
import {appAssert} from '../../../utils/assertion';
import {getTimestamp} from '../../../utils/dateFns';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injectables';
import {kInjectionKeys} from '../../contexts/injection';
import {
  SemanticFileBackendMountProvider,
  SemanticProviderUtils,
} from '../../contexts/semantic/types';
import {kFolderConstants} from '../../folders/constants';
import {areFolderpathsEqual, getFolderpathInfo} from '../../folders/utils';
import {queueJobs} from '../../jobs/utils';
import {isResourceNameEqual} from '../../utils';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {fileBackendMountExtractor, mountExists, mountNameExists} from '../utils';
import {UpdateFileBackendMountEndpoint} from './types';
import {updateFileBackendMountJoiSchema} from './validation';

const updateFileBackendMount: UpdateFileBackendMountEndpoint = async instData => {
  const mountModel = container.resolve<SemanticFileBackendMountProvider>(
    kInjectionKeys.semantic.fileBackendMount
  );
  const semanticUtils = container.resolve<SemanticProviderUtils>(
    kInjectionKeys.semantic.utils
  );

  const data = validate(instData.data, updateFileBackendMountJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
  await checkAuthorizationWithAgent({
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {action: 'updateFileBackendMount', targetId: workspace.resourceId},
  });

  const {updatedMount, job} = await semanticUtils.withTxn(async opts => {
    const mount = await mountModel.getOneById(data.mountId, opts);
    appAssert(mount, kReuseableErrors.mount.notFound());

    if (mount.backend === 'fimidara') {
      throw kReuseableErrors.mount.cannotUpdateFimidaraMount();
    }

    if (data.mount.configId) {
      const backendConfig = await kSemanticModels
        .fileBackendConfig()
        .getOneByQuery(
          {workspaceId: workspace.resourceId, resourceId: data.mount.configId},
          opts
        );

      if (!backendConfig) {
        throw kReuseableErrors.config.notFound();
      }

      if (backendConfig.backend !== mount.backend) {
        throw kReuseableErrors.mount.configMountBackendMismatch(
          backendConfig.backend,
          mount.backend
        );
      }
    }

    const mountUpdate: Partial<FileBackendMount> = {
      ...pick(data.mount, ['configId', 'index', 'name', 'description']),
      lastUpdatedAt: getTimestamp(),
      lastUpdatedBy: getActionAgentFromSessionAgent(agent),
    };

    if (data.mount.folderpath) {
      const folderpathinfo = getFolderpathInfo(data.mount.folderpath);
      appAssert(
        workspace.rootname === folderpathinfo.rootname,
        kReuseableErrors.workspace.rootnameDoesNotMatchFolderRootname(
          workspace.rootname,
          folderpathinfo.rootname
        )
      );

      mountUpdate.folderpath = folderpathinfo.namepath;
    }

    if (data.mount.mountedFrom) {
      mountUpdate.mountedFrom = data.mount.mountedFrom.split(kFolderConstants.separator);
    }

    const isFolderpathChanged =
      data.mount.folderpath &&
      !areFolderpathsEqual(
        data.mount.folderpath,
        mount.folderpath,
        /** isCaseSensitive */ true
      );

    // TODO: different backends may observe different case-sensitivities, so
    // rather than assume they are all not case-sensitive, use backend's
    // case-sensitivity
    const isMountedFromChanged =
      data.mount.mountedFrom &&
      !areFolderpathsEqual(
        data.mount.mountedFrom,
        mount.mountedFrom,
        /** isCaseSensitive */ false
      );

    if (isFolderpathChanged || isMountedFromChanged) {
      const exists = await mountExists(
        {
          backend: mount.backend,
          folderpath: data.mount.folderpath
            ? getFolderpathInfo(data.mount.folderpath).namepath
            : mount.folderpath,
          mountedFrom: data.mount.mountedFrom
            ? data.mount.mountedFrom.split(kFolderConstants.separator)
            : mount.mountedFrom,
        },
        opts
      );

      if (exists) {
        throw kReuseableErrors.mount.mountExists();
      }
    }

    if (data.mount.name && !isResourceNameEqual(data.mount.name, mount.name)) {
      const nameExists = await mountNameExists({
        workspaceId: workspace.resourceId,
        name: data.mount.name,
      });

      if (nameExists) {
        throw kReuseableErrors.mount.mountNameExists(data.mount.name);
      }
    }

    let job: Job | undefined = undefined;

    if (isFolderpathChanged || isMountedFromChanged) {
      [job] = await queueJobs<CleanupMountResolvedEntriesJobParams>(
        workspace.resourceId,
        /** parent job ID */ undefined,
        [{type: 'cleanupMountResolvedEntries', params: {mountId: mount.resourceId}}]
      );
    }

    const updatedMount = await mountModel.getAndUpdateOneById(
      mount.resourceId,
      mountUpdate,
      opts
    );

    return {job, updatedMount};
  });

  appAssert(updatedMount);
  return {mount: fileBackendMountExtractor(updatedMount), jobId: job?.resourceId};
};

export default updateFileBackendMount;
