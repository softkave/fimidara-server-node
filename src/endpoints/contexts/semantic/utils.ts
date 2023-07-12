import {getLowercaseRegExpForString} from '../../../utils/fns';
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

export function getStringListQuery<TData extends Record<string, any>>(
  stringList: string[],
  prefix: keyof TData
): Record<string, {$regex?: RegExp}> {
  return stringList.reduce((map, name, index) => {
    const key = `${prefix as string}.${index}`;
    map[key] = {$regex: getLowercaseRegExpForString(name)};
    return map;
  }, {} as Record<string, {$regex?: RegExp}>);
}
