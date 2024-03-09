import assert from 'assert';
import {
  DeleteResourceCascadeFnDefaultArgs,
  DeleteResourceJobMeta,
  DeleteResourceJobParams,
  Job,
  kJobType,
} from '../../../../definitions/job';
import {
  FimidaraResourceType,
  Resource,
  kFimidaraResourceType,
} from '../../../../definitions/system';
import {AnyFn} from '../../../../utils/types';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables';
import {SemanticProviderMutationTxnOptions} from '../../../contexts/semantic/types';
import {JobInput, queueJobs} from '../../queueJobs';
import {setJobMeta} from '../utils';
import {kCascadeDeleteDefinitions} from './compiledDefinitions';
import {
  DeleteResourceCascadeFnHelpers,
  DeleteResourceDeleteArtifactsFns,
  DeleteResourceGetArtifactsFns,
  GetArtifactsFn,
} from './types';

async function setDeleteJobGetArtifactsMeta(
  job: Job,
  type: FimidaraResourceType,
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
  type: FimidaraResourceType,
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
  type: FimidaraResourceType,
  getFn: GetArtifactsFn,
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
          type === kFimidaraResourceType.User
            ? {
                workspaceId,
                type: kFimidaraResourceType.User,
                resourceId: artifact.resourceId,
                isRemoveCollaborator: true,
              }
            : {type, workspaceId, resourceId: artifact.resourceId};

        return {
          params,
          createdBy: helpers.job.createdBy,
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
  } while (artifacts.length >= pageSize);
}

export async function processGetArtifactsFromDef(
  workspaceId: string,
  getArtifactsDef: DeleteResourceGetArtifactsFns,
  args: DeleteResourceCascadeFnDefaultArgs,
  helpers: DeleteResourceCascadeFnHelpers
) {
  const entries = Object.entries(getArtifactsDef);
  const processedTypes: FimidaraResourceType[] = [];

  for (const entry of entries) {
    const [type, getFn] = entry;

    if (getFn) {
      processedTypes.push(type as FimidaraResourceType);
      await getArtifactsAndQueueDeleteJobs(
        workspaceId,
        type as FimidaraResourceType,
        getFn,
        args,
        helpers
      );
    }
  }

  return processedTypes;
}

async function processDeleteArtifactsFromDef(
  deleteArtifactsDef: DeleteResourceDeleteArtifactsFns,
  skipTypes: FimidaraResourceType[],
  args: DeleteResourceCascadeFnDefaultArgs,
  helpers: DeleteResourceCascadeFnHelpers
) {
  const entries = Object.entries(deleteArtifactsDef);
  Object.entries(helpers.job.meta?.deleteArtifacts || {}).forEach(([type, status]) => {
    if (status?.done) {
      skipTypes.push(type as FimidaraResourceType);
    }
  });

  for (const entry of entries) {
    const [type, deleteFn] = entry;

    if (deleteFn && !skipTypes.includes(type as FimidaraResourceType)) {
      await deleteFn({args, helpers});
      kUtilsInjectables
        .promises()
        .forget(
          setDeleteJobDeleteArtifactsMeta(helpers.job, type as FimidaraResourceType)
        );
    }
  }
}

export async function runDeleteResourceJobArtifacts(job: Job) {
  const params = job.params as DeleteResourceJobParams;
  const {deleteArtifacts, getArtifacts} = kCascadeDeleteDefinitions[params.type];
  const helperFns: DeleteResourceCascadeFnHelpers = {
    job: job as Job<DeleteResourceJobParams, DeleteResourceJobMeta>,
    async withTxn(fn: AnyFn<[SemanticProviderMutationTxnOptions]>) {
      await kSemanticModels.utils().withTxn(opts => fn(opts), /** reuseTxn */ true);
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
