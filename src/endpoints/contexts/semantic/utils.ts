import {AnyFn} from '../../../utils/types';
import {BaseContextType} from '../types';
import {
  SemanticDataAccessProviderMutationRunOptions,
  SemanticDataAccessProviderUtils,
} from './types';

export class DataSemanticDataAccessProviderUtils implements SemanticDataAccessProviderUtils {
  async withTxn<TResult>(
    ctx: BaseContextType,
    fn: AnyFn<[SemanticDataAccessProviderMutationRunOptions], Promise<TResult>>,
    opts?: SemanticDataAccessProviderMutationRunOptions | undefined
  ): Promise<TResult> {
    return ctx.data.utils.withTxn(
      ctx,
      async txn => {
        return await fn({txn});
      },
      opts?.txn
    );
  }
}
