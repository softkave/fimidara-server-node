import {
  DeleteResourceJobMeta,
  DeleteResourceJobParams,
  Job,
} from '../../../../definitions/job';
import {AnyFn} from '../../../../utils/types';
import {kSemanticModels} from '../../../contexts/injection/injectables';
import {SemanticProviderMutationParams} from '../../../contexts/semantic/types';
import {kCascadeDeleteDefinitions} from './compiledDefinitions';
import {DeleteResourceCascadeFnHelpers} from './types';

export async function runDeleteResourceJobSelf(job: Job) {
  const params = job.params as DeleteResourceJobParams;
  const {deleteResourceFn} = kCascadeDeleteDefinitions[params.type];
  const helperFns: DeleteResourceCascadeFnHelpers = {
    job: job as Job<DeleteResourceJobParams, DeleteResourceJobMeta>,
    async withTxn(fn: AnyFn<[SemanticProviderMutationParams]>) {
      await kSemanticModels.utils().withTxn(opts => fn(opts), /** reuseTxn */ true);
    },
  };

  await deleteResourceFn({args: params, helpers: helperFns});
}
