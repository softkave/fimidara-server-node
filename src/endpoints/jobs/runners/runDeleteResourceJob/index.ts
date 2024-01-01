import assert from 'assert';
import {pick} from 'lodash';
import {
  DeleteResourceCascadeFnDefaultArgs,
  DeleteResourceJobParams,
  Job,
  kJobType,
} from '../../../../definitions/job';
import {
  AppResourceType,
  Resource,
  kAppResourceType,
} from '../../../../definitions/system';
import {AnyFn} from '../../../../utils/types';
import {kSemanticModels} from '../../../contexts/injection/injectables';
import {SemanticProviderMutationRunOptions} from '../../../contexts/semantic/types';
import {JobInput, queueJobs} from '../../utils';
import {deleteAgentTokenCascadeEntry} from './agentToken';
import {deleteCollaborationRequestCascadeEntry} from './collaborationRequest';
import {deleteFileCascadeEntry} from './file';
import {deleteFileBackendConfigCascadeEntry} from './fileBackendConfig';
import {deleteFileBackendMountCascadeEntry} from './fileBackendMount';
import {deleteFilePresignedPathCascadeEntry} from './filePresignedPath';
import {deleteFolderCascadeEntry} from './folder';
import {deleteNoopCascadeEntry} from './noop';
import {deletePermissionGroupCascadeEntry} from './permissionGroup';
import {deletePermissionItemCascadeEntry} from './permissionItem';
import {deleteTagCascadeEntry} from './tag';
import {
  DeleteResourceCascadeDefinitions,
  DeleteResourceCascadeFnHelpers,
  DeleteResourceDeleteSimpleArtifactsFns,
  DeleteResourceGetComplexArtifactsFns,
  GetComplexArtifactsFn,
} from './types';
import {deleteWorkspaceCascadeEntry} from './workspace';

/**
 * - Process is split into 3 steps:
 *    - fetch complex artifacts & create jobs. Complex artifacts are resources
 *      that themselves have artifacts defined in cascade defs.
 *    - delete simple artifacts
 *    - delete resource
 */

const kDefinitions: DeleteResourceCascadeDefinitions = {
  [kAppResourceType.All]: deleteNoopCascadeEntry,
  [kAppResourceType.System]: deleteNoopCascadeEntry,
  [kAppResourceType.Public]: deleteNoopCascadeEntry,
  [kAppResourceType.User]: deleteNoopCascadeEntry,
  [kAppResourceType.EndpointRequest]: deleteNoopCascadeEntry,
  [kAppResourceType.App]: deleteNoopCascadeEntry,
  [kAppResourceType.UsageRecord]: deleteNoopCascadeEntry,
  [kAppResourceType.AssignedItem]: deleteNoopCascadeEntry,
  [kAppResourceType.ResolvedMountEntry]: deleteNoopCascadeEntry,
  [kAppResourceType.Job]: deleteNoopCascadeEntry,
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

async function processComplexArtifactsForType(
  workspaceId: string,
  type: AppResourceType,
  getFn: GetComplexArtifactsFn,
  args: DeleteResourceCascadeFnDefaultArgs,
  helpers: DeleteResourceCascadeFnHelpers
) {
  let page = 0;
  let artifacts: Resource[] = [];
  const pageSize = 1000;

  do {
    artifacts = (await getFn({args, helpers, opts: {page, pageSize}})) || [];
    await queueJobs(
      workspaceId,
      helpers.job.resourceId,
      artifacts.map((artifact): JobInput => {
        const params: DeleteResourceJobParams =
          type === kAppResourceType.User
            ? {
                type: kAppResourceType.User,
                args: {workspaceId, resourceId: artifact.resourceId},
                isRemoveCollaborator: true,
              }
            : {
                type,
                args: {workspaceId, resourceId: artifact.resourceId},
              };

        return {
          params,
          type: kJobType.deleteResource,
          shard: helpers.job.shard,
          priority: helpers.job.priority,
        };
      })
    );

    page += 1;
  } while (artifacts.length);
}

async function processComplexArtifacts(
  workspaceId: string,
  complexArtifactsDef: DeleteResourceGetComplexArtifactsFns,
  args: DeleteResourceCascadeFnDefaultArgs,
  helpers: DeleteResourceCascadeFnHelpers
) {
  const entries = Object.entries(complexArtifactsDef);

  for (const entry of entries) {
    const [type, getFn] = entry;

    if (getFn) {
      await processComplexArtifactsForType(
        workspaceId,
        type as AppResourceType,
        getFn,
        args,
        helpers
      );
    }
  }
}

async function processSimpleArtifacts(
  simpleArtifactsDef: DeleteResourceDeleteSimpleArtifactsFns,
  args: DeleteResourceCascadeFnDefaultArgs,
  helpers: DeleteResourceCascadeFnHelpers
) {
  const entries = Object.entries(simpleArtifactsDef);

  for (const entry of entries) {
    const [, deleteFn] = entry;

    if (deleteFn) {
      await deleteFn({args, helpers});
    }
  }
}

export async function runDeleteResourceJob(job: Job) {
  const params = job.params as DeleteResourceJobParams;
  const {deleteResourceFn, deleteSimpleArtifacts, getComplexArtifacts} =
    kDefinitions[params.type];
  const simpleArtifactsDef = pick(
    deleteSimpleArtifacts,
    Object.keys(deleteSimpleArtifacts).filter(
      type => getComplexArtifacts[type as AppResourceType] === null
    )
  );
  const helperFns: DeleteResourceCascadeFnHelpers = {
    job,
    async withTxn(fn: AnyFn<[SemanticProviderMutationRunOptions]>) {
      await kSemanticModels.utils().withTxn(opts => fn(opts));
    },
  };

  assert(job.workspaceId);
  await processComplexArtifacts(
    job.workspaceId,
    getComplexArtifacts,
    params.args,
    helperFns
  );
  await processSimpleArtifacts(
    simpleArtifactsDef as DeleteResourceDeleteSimpleArtifactsFns,
    params.args,
    helperFns
  );
  await deleteResourceFn({args: params.args, helpers: helperFns});
}
