import assert from 'assert';
import {AnyObject} from 'softkave-js-utils';
import {kIjxSemantic, kIjxUtils} from '../../../../contexts/ijx/injectables.js';
import {SemanticProviderMutationParams} from '../../../../contexts/semantic/types.js';
import {
  DeleteResourceCascadeFnDefaultArgs,
  DeleteResourceJobMeta,
  DeleteResourceJobParams,
  Job,
  kJobType,
} from '../../../../definitions/job.js';
import {
  FimidaraResourceType,
  Resource,
  kFimidaraResourceType,
} from '../../../../definitions/system.js';
import {AnyFn} from '../../../../utils/types.js';
import {JobInput, queueJobs} from '../../queueJobs.js';
import {setDeleteJobPreRunMeta, setJobMeta} from '../utils.js';
import {kCascadeDeleteDefinitions} from './compiledDefinitions.js';
import {
  DeleteResourceCascadeFnHelpers,
  DeleteResourceDeleteArtifactsFns,
  DeleteResourceGetArtifactsToDeleteFns,
  GetArtifactsFn,
} from './types.js';

async function setDeleteJobGetArtifactsMeta(
  job: Job,
  type: FimidaraResourceType,
  page: number,
  pageSize: number
) {
  await setJobMeta<DeleteResourceJobMeta>(job.resourceId, meta => ({
    ...meta,
    getArtifacts: {
      ...meta?.getArtifacts,
      [type]: {page, pageSize},
    },
  }));
}

async function setDeleteJobDeleteArtifactsMeta(
  job: Job,
  type: FimidaraResourceType,
  done = true
) {
  await setJobMeta<DeleteResourceJobMeta>(job.resourceId, meta => ({
    ...meta,
    deleteArtifacts: {
      ...meta?.deleteArtifacts,
      [type]: {done},
    },
  }));
}

async function getArtifactsAndQueueDeleteJobs(
  workspaceId: string,
  type: FimidaraResourceType,
  getFn: GetArtifactsFn,
  args: DeleteResourceCascadeFnDefaultArgs,
  helpers: DeleteResourceCascadeFnHelpers,
  preRunMeta: AnyObject
) {
  let page = helpers.job.meta?.getArtifacts?.[type]?.page || 0;
  let artifacts: Resource[] = [];
  const pageSize = helpers.job.meta?.getArtifacts?.[type]?.pageSize || 1000;

  do {
    artifacts =
      (await getFn({args, helpers, preRunMeta, opts: {page, pageSize}})) || [];
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
          type: kJobType.deleteResource,
          shard: helpers.job.shard,
          priority: helpers.job.priority,
          idempotencyToken: Date.now().toString(),
        };
      })
    );

    page += 1;
    kIjxUtils
      .promises()
      .callAndForget(() =>
        setDeleteJobGetArtifactsMeta(helpers.job, type, page, pageSize)
      );
  } while (artifacts.length >= pageSize);
}

export async function processGetArtifactsFromDef(
  workspaceId: string,
  getArtifactsDef: DeleteResourceGetArtifactsToDeleteFns,
  args: DeleteResourceCascadeFnDefaultArgs,
  helpers: DeleteResourceCascadeFnHelpers,
  preRunMeta: AnyObject
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
        helpers,
        preRunMeta
      );
    }
  }

  return processedTypes;
}

async function processDeleteArtifactsFromDef(
  deleteArtifactsDef: DeleteResourceDeleteArtifactsFns,
  skipTypes: FimidaraResourceType[],
  args: DeleteResourceCascadeFnDefaultArgs,
  helpers: DeleteResourceCascadeFnHelpers,
  preRunMeta: AnyObject
) {
  const entries = Object.entries(deleteArtifactsDef);
  Object.entries(helpers.job.meta?.deleteArtifacts || {}).forEach(
    ([type, status]) => {
      if (status?.done) {
        skipTypes.push(type as FimidaraResourceType);
      }
    }
  );

  for (const entry of entries) {
    const [type, deleteFn] = entry;

    if (deleteFn && !skipTypes.includes(type as FimidaraResourceType)) {
      await deleteFn({args, helpers, preRunMeta});
      kIjxUtils
        .promises()
        .callAndForget(() =>
          setDeleteJobDeleteArtifactsMeta(
            helpers.job,
            type as FimidaraResourceType
          )
        );
    }
  }
}

export async function runDeleteResourceJob(job: Job) {
  assert(job.type === kJobType.deleteResource);

  const params = job.params as DeleteResourceJobParams;
  const {
    deleteArtifacts,
    getPreRunMetaFn,
    deleteResourceFn,
    getArtifactsToDelete: getArtifacts,
  } = kCascadeDeleteDefinitions[params.type];
  const helperFns: DeleteResourceCascadeFnHelpers = {
    job: job as Job<DeleteResourceJobParams, DeleteResourceJobMeta>,
    async withTxn(fn: AnyFn<[SemanticProviderMutationParams]>) {
      await kIjxSemantic.utils().withTxn(opts => fn(opts));
    },
  };

  assert(job.workspaceId);
  const preRunMeta = await getPreRunMetaFn({args: params, helpers: helperFns});
  await setDeleteJobPreRunMeta(job, preRunMeta);
  const proccessedTypes = await processGetArtifactsFromDef(
    job.workspaceId,
    getArtifacts,
    params,
    helperFns,
    preRunMeta
  );
  await processDeleteArtifactsFromDef(
    deleteArtifacts,
    proccessedTypes,
    params,
    helperFns,
    preRunMeta
  );
  await deleteResourceFn({args: params, preRunMeta, helpers: helperFns});
}
