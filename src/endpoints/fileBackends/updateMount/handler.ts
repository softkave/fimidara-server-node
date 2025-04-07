import {pick} from 'lodash-es';
import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {checkAuthorizationWithAgent} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {
  FileBackendMount,
  kFileBackendType,
} from '../../../definitions/fileBackend.js';
import {
  CleanupMountResolvedEntriesJobParams,
  Job,
  kJobType,
} from '../../../definitions/job.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {pathSplit} from '../../../utils/fns.js';
import {kReuseableErrors} from '../../../utils/reusableErrors.js';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {
  areFolderpathsEqual,
  ensureFolders,
  getFolderpathInfo,
} from '../../folders/utils.js';
import {queueJobs} from '../../jobs/queueJobs.js';
import {isResourceNameEqual} from '../../utils.js';
import {
  assertRootname,
  getWorkspaceFromEndpointInput,
} from '../../workspaces/utils.js';
import {
  fileBackendMountExtractor,
  mountExists,
  mountNameExists,
} from '../utils.js';
import {UpdateFileBackendMountEndpoint} from './types.js';
import {updateFileBackendMountJoiSchema} from './validation.js';

const updateFileBackendMount: UpdateFileBackendMountEndpoint =
  async reqData => {
    const mountModel = kIjxSemantic.fileBackendMount();
    const semanticUtils = kIjxSemantic.utils();

    const data = validate(reqData.data, updateFileBackendMountJoiSchema);
    const agent = await kIjxUtils
      .session()
      .getAgentFromReq(
        reqData,
        kSessionUtils.permittedAgentTypes.api,
        kSessionUtils.accessScopes.api
      );
    const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
    await checkAuthorizationWithAgent({
      agent,
      workspace,
      workspaceId: workspace.resourceId,
      target: {
        action: kFimidaraPermissionActions.updateFileBackendMount,
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
        const backendConfig = await kIjxSemantic
          .fileBackendConfig()
          .getOneByQuery(
            {
              workspaceId: workspace.resourceId,
              resourceId: data.mount.configId,
            },
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
        const folderpathinfo = getFolderpathInfo(data.mount.folderpath, {
          allowRootFolder: false,
          containsRootname: true,
        });
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
              ? getFolderpathInfo(data.mount.folderpath, {
                  allowRootFolder: false,
                  containsRootname: true,
                }).namepath
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

      if (
        data.mount.name &&
        !isResourceNameEqual(data.mount.name, mount.name)
      ) {
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
          {
            createdBy: agent,
            type: kJobType.cleanupMountResolvedEntries,
            params: {mountId: mount.resourceId},
            idempotencyToken: Date.now().toString(),
          },
          {opts, jobsToReturn: 'all'}
        );
      }

      const [updatedMount] = await Promise.all([
        mountModel.getAndUpdateOneById(mount.resourceId, mountUpdate, opts),
        mountUpdate.namepath &&
          ensureFolders(agent, workspace, mountUpdate.namepath),
      ]);

      return {job, updatedMount};
    });

    appAssert(updatedMount);
    return {
      mount: fileBackendMountExtractor(updatedMount),
      jobId: job?.resourceId,
    };
  };

export default updateFileBackendMount;
