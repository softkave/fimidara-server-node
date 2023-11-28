import {isNil, set} from 'lodash';
import {getLowercaseRegExpForString, toArray} from '../../../utils/fns';
import {AnyFn, OrArray, StringKeysOnly} from '../../../utils/types';
import {
  ArrayFieldQueryOps,
  ComparisonLiteralFieldQueryOps,
  DataQuery,
  KeyedComparisonOps,
} from '../data/types';
import {BaseContextType} from '../types';
import {
  SemanticProviderMutationRunOptions,
  SemanticProviderRunOptions,
  SemanticProviderUtils,
} from './types';

export class DataSemanticProviderUtils implements SemanticProviderUtils {
  async withTxn<TResult>(
    ctx: BaseContextType,
    fn: AnyFn<[SemanticProviderMutationRunOptions], Promise<TResult>>,
    opts?: SemanticProviderRunOptions | undefined
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
  prefix: keyof TData,
  includeSizeOp = false
): Record<string, {$regex?: RegExp}> {
  const query: Record<
    string,
    Pick<ComparisonLiteralFieldQueryOps, '$regex'> &
      Pick<ArrayFieldQueryOps<any>, '$size'>
  > = {};
  stringList.reduce((map, name, index) => {
    const key = `${prefix as string}.${index}`;
    map[key] = {$regex: getLowercaseRegExpForString(name)};
    return map;
  }, query);

  if (includeSizeOp) {
    query[prefix as string] = {$size: stringList.length};
  }

  return query;
}

export function getInAndNinQuery<
  TData extends Record<string, any>,
  TKey extends StringKeysOnly<TData> = StringKeysOnly<TData>
>(
  prefix: TKey,
  /** `null` or `undefined` will not go into query. To explicitly handle them,
   * pass `[null]` or `[undefined]` */
  inList: OrArray<TData[TKey]> | undefined,
  /** `null` or `undefined` will not go into query. To explicitly handle them,
   * pass `[null]` or `[undefined]` */
  ninList?: OrArray<TData[TKey]> | undefined
) {
  const inKey: KeyedComparisonOps<Record<string, unknown>> = `${prefix}.$in` as const;
  const ninKey: KeyedComparisonOps<Record<string, unknown>> = `${prefix}.$nin` as const;
  const query: DataQuery<TData> = {};

  if (!isNil(inList)) set(query, inKey, toArray(inList));
  if (!isNil(ninList)) set(query, ninKey, toArray(ninList));

  return query;
}
