import {pick} from 'lodash';
import {FileBackendMount, kFileBackendType} from '../../../definitions/fileBackend';
import {
  CleanupMountResolvedEntriesJobParams,
  Job,
  kJobType,
} from '../../../definitions/job';
import {kPermissionsMap} from '../../../definitions/permissionItem';
import {appAssert} from '../../../utils/assertion';
import {getTimestamp} from '../../../utils/dateFns';
import {pathSplit} from '../../../utils/fns';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {areFolderpathsEqual, ensureFolders, getFolderpathInfo} from '../../folders/utils';
import {isResourceNameEqual} from '../../utils';
import {assertRootname, getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {fileBackendMountExtractor, mountExists, mountNameExists} from '../utils';
import {UpdateFileBackendMountEndpoint} from './types';
import {updateFileBackendMountJoiSchema} from './validation';
import {queueJobs} from '../../jobs/queueJobs';

const updateFileBackendMount: UpdateFileBackendMountEndpoint = async instData => {
  const mountModel = kSemanticModels.fileBackendMount();
  const semanticUtils = kSemanticModels.utils();

  const data = validate(instData.data, updateFileBackendMountJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
  await checkAuthorizationWithAgent({
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {
      action: kPermissionsMap.updateFileBackendMount,
      targetId: workspace.resourceId,
    },
  });

  const {updatedMount, job} = await semanticUtils.withTxn(async opts => {
    const mount = await mountModel.getOneById(data.mountId, opts);
    appAssert(mount, kReuseableErrors.mount.notFound());

    if (mount.backend === kFileBackendType.fimidara) {
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
      assertRootname(folderpathinfo.rootname);
      appAssert(
        workspace.rootname === folderpathinfo.rootname,
        kReuseableErrors.workspace.rootnameDoesNotMatchFolderRootname(
          workspace.rootname,
          folderpathinfo.rootname
        )
      );
      mountUpdate.namepath = folderpathinfo.namepath;
    }

    if (data.mount.mountedFrom) {
      mountUpdate.mountedFrom = pathSplit(data.mount.mountedFrom);
    }

    const isFolderpathChanged =
      data.mount.folderpath &&
      !areFolderpathsEqual(
        data.mount.folderpath,
        mount.namepath,
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
          workspaceId: workspace.resourceId,
          backend: mount.backend,
          namepath: data.mount.folderpath
            ? getFolderpathInfo(data.mount.folderpath).namepath
            : mount.namepath,
          mountedFrom: data.mount.mountedFrom
            ? pathSplit(data.mount.mountedFrom)
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
        throw kReuseableErrors.mount.mountNameExists();
      }
    }

    let job: Job | undefined = undefined;

    if (isFolderpathChanged || isMountedFromChanged) {
      [job] = await queueJobs<CleanupMountResolvedEntriesJobParams>(
        workspace.resourceId,
        /** parent job ID */ undefined,
        [
          {
            type: kJobType.cleanupMountResolvedEntries,
            params: {mountId: mount.resourceId},
          },
        ],
        {jobsToReturn: 'all'}
      );
    }

    const [updatedMount] = await Promise.all([
      mountModel.getAndUpdateOneById(mount.resourceId, mountUpdate, opts),
      mountUpdate.namepath && ensureFolders(agent, workspace, mountUpdate.namepath, opts),
    ]);

    return {job, updatedMount};
  });

  appAssert(updatedMount);
  return {mount: fileBackendMountExtractor(updatedMount), jobId: job?.resourceId};
};

export default updateFileBackendMount;
