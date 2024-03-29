import {AnyObject} from 'mongoose';
import {Job} from '../../../definitions/job';
import {AnyFn} from '../../../utils/types';
import {kSemanticModels} from '../../contexts/injection/injectables';

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
      return newMeta;
    }

    return undefined;
  }, /** reuse txn from async local store */ false);
}
