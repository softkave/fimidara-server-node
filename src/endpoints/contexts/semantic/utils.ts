import {isNil, set} from 'lodash';
import {getIgnoreCaseRegExpForString, toArray} from '../../../utils/fns';
import {AnyFn, AnyObject, OrArray, StringKeysOnly} from '../../../utils/types';
import {DataQuery, KeyedComparisonOps} from '../data/types';
import {kDataModels} from '../injection/injectables';
import {SemanticProviderMutationRunOptions, SemanticProviderUtils} from './types';

export class DataSemanticProviderUtils implements SemanticProviderUtils {
  async withTxn<TResult>(
    fn: AnyFn<[SemanticProviderMutationRunOptions], Promise<TResult>>,
    reuseAsyncLocalTxn: boolean = true
  ): Promise<TResult> {
    return await kDataModels.utils().withTxn(async txn => {
      return await fn({txn});
    }, reuseAsyncLocalTxn);
  }
}

export function getStringListQuery<TData extends AnyObject>(
  stringList: string[],
  prefix: keyof TData,
  op: '$regex' | '$eq' = '$eq',
  includeSizeOp: boolean = false
): DataQuery<TData> {
  const query: DataQuery<AnyObject> = {};

  if (stringList.length === 0) {
    // MongoDB array queries with `{$all: [], $size: 0}` do not work, so using
    // `{$eq: []}` instead, since that works
    query[prefix as string] = {$eq: []};
    return query;
  }

  stringList.reduce((map, name, index) => {
    const key = `${prefix as string}.${index}`;
    map[key] = {[op]: op === '$eq' ? name : getIgnoreCaseRegExpForString(name)};
    return map;
  }, query);

  if (includeSizeOp) {
    query[prefix as string] = {$size: stringList.length};
  }

  return query;
}

export function getInAndNinQuery<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TData extends Record<string, any>,
  TKey extends StringKeysOnly<TData> = StringKeysOnly<TData>,
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
