import {AnyFn, AnyObject} from 'softkave-js-utils';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {DeleteResourceJobMeta, Job} from '../../../definitions/job.js';

export async function setJobMeta<TMeta extends AnyObject>(
  jobId: string,
  makeMetaFn: AnyFn<[TMeta | undefined], TMeta>
) {
  return await kSemanticModels.utils().withTxn(async opts => {
    const job = (await kSemanticModels.job().getOneById(jobId, {
      ...opts,
      projection: {meta: true},
    })) as Pick<Job<AnyObject, TMeta>, 'meta'>;

    if (job) {
      const newMeta = makeMetaFn(job.meta);

      // TODO: implement a way to update specific fields without overwriting
      // existing data, and without needing to get data from DB like we're
      // doing here
      await kSemanticModels.job().updateOneById(jobId, {meta: newMeta}, opts);
      job.meta = newMeta;
      return newMeta;
    }

    return undefined;
  });
}

export async function setJobMeta02<TMeta extends AnyObject>(
  jobId: string,
  meta: TMeta
) {
  return await kSemanticModels.utils().withTxn(async opts => {
    await kSemanticModels.job().updateOneById(jobId, {meta}, opts);
  });
}

export async function setDeleteJobPreRunMeta(job: Job, preRunMeta: AnyObject) {
  await setJobMeta<DeleteResourceJobMeta>(job.resourceId, meta => ({
    ...meta,
    preRunMeta,
  }));
}
