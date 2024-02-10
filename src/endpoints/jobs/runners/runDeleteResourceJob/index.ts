import assert from 'assert';
import {
  DeleteResourceCascadeFnDefaultArgs,
  DeleteResourceJobMeta,
  DeleteResourceJobParams,
  Job,
  kJobStatus,
  kJobType,
} from '../../../../definitions/job';
import {
  AppResourceType,
  Resource,
  kAppResourceType,
} from '../../../../definitions/system';
import {getNewIdForResource} from '../../../../utils/resource';
import {AnyFn} from '../../../../utils/types';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables';
import {SemanticProviderMutationRunOptions} from '../../../contexts/semantic/types';
import {JobInput, queueJobs} from '../../utils';
import {setJobMeta} from '../utils';
import {deleteAgentTokenCascadeEntry} from './agentToken';
import {deleteCollaborationRequestCascadeEntry} from './collaborationRequest';
import {deleteFileCascadeEntry} from './file';
import {deleteFileBackendConfigCascadeEntry} from './fileBackendConfig';
import {deleteFileBackendMountCascadeEntry} from './fileBackendMount';
import {deleteFilePresignedPathCascadeEntry} from './filePresignedPath';
import {deleteFolderCascadeEntry} from './folder';
import {noopDeleteCascadeEntry} from './genericEntries';
import {deletePermissionGroupCascadeEntry} from './permissionGroup';
import {deletePermissionItemCascadeEntry} from './permissionItem';
import {deleteTagCascadeEntry} from './tag';
import {
  DeleteResourceCascadeDefinitions,
  DeleteResourceCascadeFnHelpers,
  DeleteResourceDeleteArtifactsFns,
  DeleteResourceGetArtifactsFns,
  getArtifactsFn,
} from './types';
import {deleteWorkspaceCascadeEntry} from './workspace';

/**
 * - Process is split into 3 steps:
 *    - fetch complex artifacts & create jobs. Complex artifacts are resources
 *      that themselves have artifacts defined in cascade defs.
 *    - delete simple artifact types not present in complex artifacts.
 *    - delete resource
 */

const kDefinitions: DeleteResourceCascadeDefinitions = {
  [kAppResourceType.All]: noopDeleteCascadeEntry,
  [kAppResourceType.System]: noopDeleteCascadeEntry,
  [kAppResourceType.Public]: noopDeleteCascadeEntry,
  [kAppResourceType.User]: noopDeleteCascadeEntry,
  [kAppResourceType.EndpointRequest]: noopDeleteCascadeEntry,
  [kAppResourceType.App]: noopDeleteCascadeEntry,
  [kAppResourceType.UsageRecord]: noopDeleteCascadeEntry,
  [kAppResourceType.AssignedItem]: noopDeleteCascadeEntry,
  [kAppResourceType.ResolvedMountEntry]: noopDeleteCascadeEntry,
  [kAppResourceType.Job]: noopDeleteCascadeEntry,
  [kAppResourceType.Workspace]: deleteWorkspaceCascadeEntry,
  [kAppResourceType.CollaborationRequest]: deleteCollaborationRequestCascadeEntry,
  [kAppResourceType.AgentToken]: deleteAgentTokenCascadeEntry,
  [kAppResourceType.PermissionGroup]: deletePermissionGroupCascadeEntry,
  [kAppResourceType.Folder]: deleteFolderCascadeEntry,
  [kAppResourceType.File]: deleteFileCascadeEntry,
  [kAppResourceType.Tag]: deleteTagCascadeEntry,
  [kAppResourceType.FilePresignedPath]: deleteFilePresignedPathCascadeEntry,
  [kAppResourceType.FileBackendMount]: deleteFileBackendMountCascadeEntry,
  [kAppResourceType.FileBackendConfig]: deleteFileBackendConfigCascadeEntry,
  [kAppResourceType.PermissionItem]: deletePermissionItemCascadeEntry,
};

async function setDeleteJobGetArtifactsMeta(
  job: Job,
  type: AppResourceType,
  page: number,
  pageSize: number
) {
  const updatedMeta = await setJobMeta<DeleteResourceJobMeta>(job.resourceId, meta => ({
    ...meta,
    getArtifacts: {
      ...meta?.getArtifacts,
      [type]: {page, pageSize},
    },
  }));
  job.meta = updatedMeta;
  return job;
}

async function setDeleteJobDeleteArtifactsMeta(
  job: Job,
  type: AppResourceType,
  done = true
) {
  const updatedMeta = await setJobMeta<DeleteResourceJobMeta>(job.resourceId, meta => ({
    ...meta,
    deleteArtifacts: {
      ...meta?.deleteArtifacts,
      [type]: {done},
    },
  }));
  job.meta = updatedMeta;
  return job;
}

async function getArtifactsAndQueueDeleteJobs(
  workspaceId: string,
  type: AppResourceType,
  getFn: getArtifactsFn,
  args: DeleteResourceCascadeFnDefaultArgs,
  helpers: DeleteResourceCascadeFnHelpers
) {
  let page = helpers.job.meta?.getArtifacts?.[type]?.page || 0;
  let artifacts: Resource[] = [];
  const pageSize = helpers.job.meta?.getArtifacts?.[type]?.pageSize || 1000;

  do {
    artifacts = (await getFn({args, helpers, opts: {page, pageSize}})) || [];
    await queueJobs(
      workspaceId,
      helpers.job.resourceId,
      artifacts.map((artifact): JobInput => {
        const params: DeleteResourceJobParams =
          type === kAppResourceType.User
            ? {
                workspaceId,
                type: kAppResourceType.User,
                resourceId: artifact.resourceId,
                isRemoveCollaborator: true,
              }
            : {type, workspaceId, resourceId: artifact.resourceId};

        return {
          params,
          type: kJobType.deleteResource0,
          shard: helpers.job.shard,
          priority: helpers.job.priority,
        };
      })
    );

    page += 1;
    kUtilsInjectables
      .promises()
      .forget(setDeleteJobGetArtifactsMeta(helpers.job, type, page, pageSize));
  } while (artifacts.length);
}

export async function processGetArtifactsFromDef(
  workspaceId: string,
  getArtifactsDef: DeleteResourceGetArtifactsFns,
  args: DeleteResourceCascadeFnDefaultArgs,
  helpers: DeleteResourceCascadeFnHelpers
) {
  const entries = Object.entries(getArtifactsDef);
  const processedTypes: AppResourceType[] = [];

  for (const entry of entries) {
    const [type, getFn] = entry;

    if (getFn) {
      processedTypes.push(type as AppResourceType);
      await getArtifactsAndQueueDeleteJobs(
        workspaceId,
        type as AppResourceType,
        getFn,
        args,
        helpers
      );
    }
  }

  return processedTypes;
}

export async function processDeleteArtifactsFromDef(
  deleteArtifactsDef: DeleteResourceDeleteArtifactsFns,
  skipTypes: AppResourceType[],
  args: DeleteResourceCascadeFnDefaultArgs,
  helpers: DeleteResourceCascadeFnHelpers
) {
  const entries = Object.entries(deleteArtifactsDef);
  Object.entries(helpers.job.meta?.deleteArtifacts || {}).forEach(([type, status]) => {
    if (status?.done) {
      skipTypes.push(type as AppResourceType);
    }
  });

  for (const entry of entries) {
    const [type, deleteFn] = entry;

    if (deleteFn && !skipTypes.includes(type as AppResourceType)) {
      await deleteFn({args, helpers});
      kUtilsInjectables
        .promises()
        .forget(setDeleteJobDeleteArtifactsMeta(helpers.job, type as AppResourceType));
    }
  }
}

export async function runDeleteResourceJobArtifacts(job: Job) {
  const params = job.params as DeleteResourceJobParams;
  const {deleteArtifacts, getArtifacts} = kDefinitions[params.type];
  const helperFns: DeleteResourceCascadeFnHelpers = {
    job: job as Job<DeleteResourceJobParams, DeleteResourceJobMeta>,
    async withTxn(fn: AnyFn<[SemanticProviderMutationRunOptions]>) {
      await kSemanticModels.utils().withTxn(opts => fn(opts));
    },
  };

  assert(job.workspaceId);
  const proccessedTypes = await processGetArtifactsFromDef(
    job.workspaceId,
    getArtifacts,
    params,
    helperFns
  );
  await processDeleteArtifactsFromDef(
    deleteArtifacts,
    proccessedTypes,
    params,
    helperFns
  );
}

export async function runDeleteResourceJobSelf(job: Job) {
  const params = job.params as DeleteResourceJobParams;
  const {deleteResourceFn} = kDefinitions[params.type];
  const helperFns: DeleteResourceCascadeFnHelpers = {
    job: job as Job<DeleteResourceJobParams, DeleteResourceJobMeta>,
    async withTxn(fn: AnyFn<[SemanticProviderMutationRunOptions]>) {
      await kSemanticModels.utils().withTxn(opts => fn(opts));
    },
  };

  await deleteResourceFn({args: params, helpers: helperFns});
}

export async function runDeleteResourceJob0(job: Job) {
  const deleteArtifactsJobId = getNewIdForResource(kAppResourceType.Job);
  await kSemanticModels.utils().withTxn(async () => {
    // queueJobs should use current context's txn, so both should fail if one
    // fails
    await Promise.all([
      queueJobs<DeleteResourceJobParams>(
        job.workspaceId,
        job.resourceId,
        {
          type: kJobType.deleteResourceArtifacts,
          shard: job.shard,
          priority: job.priority,
          params: job.params as DeleteResourceJobParams,
        },
        {seed: {resourceId: deleteArtifactsJobId}}
      ),
      queueJobs<DeleteResourceJobParams>(job.workspaceId, job.resourceId, {
        type: kJobType.deleteResourceSelf,
        shard: job.shard,
        priority: job.priority,
        params: job.params as DeleteResourceJobParams,
        runAfter: {
          jobId: deleteArtifactsJobId,
          status: [kJobStatus.completed],
          satisfied: false,
        },
      }),
    ]);
  });
}
