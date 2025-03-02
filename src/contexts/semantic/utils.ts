import {isNil, set} from 'lodash-es';
import {AnyFn, AnyObject} from 'softkave-js-utils';
import {appAssert} from '../../utils/assertion.js';
import {convertToArray} from '../../utils/fns.js';
import {getNewId} from '../../utils/resource.js';
import {OrArray, StringKeysOnly} from '../../utils/types.js';
import {
  ComparisonLiteralFieldQueryOps,
  DataQuery,
  KeyedComparisonOps,
} from '../data/types.js';
import {kIjxData} from '../ijx/injectables.js';
import {
  SemanticProviderMutationParams,
  SemanticProviderUtils,
} from './types.js';

interface InternalTxnStructure {
  __fimidaraTxnId?: string;
}

export class DataSemanticProviderUtils implements SemanticProviderUtils {
  useTxnId(txn: unknown): string | undefined {
    if (!txn) {
      return undefined;
    }

    const id = (txn as InternalTxnStructure).__fimidaraTxnId;
    appAssert(id);
    return id;
  }

  async withTxn<TResult>(
    fn: AnyFn<[SemanticProviderMutationParams], Promise<TResult>>,
    opts?: SemanticProviderMutationParams
  ): Promise<TResult> {
    return await kIjxData.utils().withTxn(
      async txn => {
        if (!(txn as InternalTxnStructure).__fimidaraTxnId) {
          (txn as InternalTxnStructure).__fimidaraTxnId = 'txn_' + getNewId();
        }

        return await fn({txn});
      },
      opts?.txn
    );
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
    const q: ComparisonLiteralFieldQueryOps<string> =
      op === '$eq' ? {$eq: name} : getIgnoreCaseDataQueryRegExp(name);
    map[key] = q;
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
  const inKey: KeyedComparisonOps<Record<string, unknown>> =
    `${prefix}.$in` as const;
  const ninKey: KeyedComparisonOps<Record<string, unknown>> =
    `${prefix}.$nin` as const;
  const query: DataQuery<TData> = {};

  if (!isNil(inList)) set(query, inKey, convertToArray(inList));
  if (!isNil(ninList)) set(query, ninKey, convertToArray(ninList));

  return query;
}

export function getIgnoreCaseDataQueryRegExp(
  str: string
): ComparisonLiteralFieldQueryOps<string> {
  return {$regex: `^${str}$`, $options: 'i'};
}
