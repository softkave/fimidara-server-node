import {
  Job,
  DeleteResourceJobParams,
  DeleteResourceJobMeta,
} from '../../../../definitions/job';
import {AnyFn} from '../../../../utils/types';
import {kSemanticModels} from '../../../contexts/injection/injectables';
import {SemanticProviderMutationRunOptions} from '../../../contexts/semantic/types';
import {kCascadeDeleteDefinitions} from './compiledDefinitions';
import {DeleteResourceCascadeFnHelpers} from './types';

export async function runDeleteResourceJobSelf(job: Job) {
  const params = job.params as DeleteResourceJobParams;
  const {deleteResourceFn} = kCascadeDeleteDefinitions[params.type];
  const helperFns: DeleteResourceCascadeFnHelpers = {
    job: job as Job<DeleteResourceJobParams, DeleteResourceJobMeta>,
    async withTxn(fn: AnyFn<[SemanticProviderMutationRunOptions]>) {
      await kSemanticModels.utils().withTxn(opts => fn(opts));
    },
  };

  await deleteResourceFn({args: params, helpers: helperFns});
}
