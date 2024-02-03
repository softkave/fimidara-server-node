import {compact, flatten, isArray, isObject, mergeWith, uniq} from 'lodash';
import path from 'path';
import {Readable} from 'stream';
import {Resource} from '../definitions/system';
import {kFolderConstants} from '../endpoints/folders/constants';
import {appAssert} from './assertion';
import {kReuseableErrors} from './reusableErrors';
import {AnyFn, AnyObject} from './types';

export function cast<ToType>(resource: unknown): ToType {
  return resource as unknown as ToType;
}

export function isObjectEmpty(data: Record<string | number, unknown>) {
  return Object.keys(data).length === 0;
}

export function isObjectFieldsEmpty<T extends AnyObject>(data: T) {
  for (const k in data) {
    if (data[k] !== undefined && data[k] !== null) {
      return false;
    }
  }
  return true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getFirstArg<T extends any[]>(...args: T): T[0] {
  return args[0];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
export async function noopAsync(...args: any) {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyMixins(derivedConstructors: any, baseConstructors: any[]) {
  baseConstructors.forEach(baseConstructor => {
    Object.getOwnPropertyNames(baseConstructor.prototype).forEach(name => {
      if (name !== 'constructor') {
        derivedConstructors.prototype[name] = baseConstructor.prototype[name];
      }
    });
  });
}

export function applyMixins02<C1, C2>(
  derivedConstructors: C1,
  baseConstructors: [C2]
): C1 & C2 {
  return cast(applyMixins(derivedConstructors, baseConstructors));
}

export function applyMixins03<C1, C2, C3>(
  derivedConstructors: C1,
  baseConstructors: [C2, C3]
): C1 & C2 & C3 {
  return cast(applyMixins(derivedConstructors, baseConstructors));
}

export function applyMixins04<C1, C2, C3, C4>(
  derivedConstructors: C1,
  baseConstructors: [C2, C3, C4]
): C1 & C2 & C3 & C4 {
  return cast(applyMixins(derivedConstructors, baseConstructors));
}

export function findItemWithField<T>(
  items: T[],
  val: unknown,
  field: keyof T
): T | undefined {
  return items.find(item => {
    return item[field] === val;
  });
}

export function makeKey(
  fields: Array<string | number | undefined | null | boolean>,
  separator = '-',
  omitFalsy = true
) {
  if (omitFalsy) {
    fields = compact(fields);
  }
  return fields.join(separator);
}

export function objectHasData(data: AnyObject) {
  return Object.keys(data).length > 0;
}

export function waitTimeout(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

export function makeWaitTimeoutFn(timeoutMs: number) {
  return () => waitTimeout(timeoutMs);
}

export function reverseMap<K extends string, V extends string>(
  m: Record<K, V>
): Record<V, K> {
  const r: Record<V, K> = cast<Record<V, K>>({});
  for (const k in m) {
    r[m[k]] = k;
  }
  return r;
}

export function getRandomArbitrary(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);

  // The maximum is exclusive and the minimum is inclusive
  return Math.floor(Math.random() * (max - min) + min);
}

export function getRandomIntInclusive(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);

  // The maximum is inclusive and the minimum is inclusive
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function uncapitalizeFirstLetter(str: string) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

export function calculatePageSize(
  count: number,
  pageSize: number,
  /** zero-index based page */ page: number
) {
  count = Math.max(count, 0);
  pageSize = Math.max(pageSize, 0);
  page = Math.max(page, 0);

  if (count === 0 ?? pageSize === 0) {
    return 0;
  }

  const maxFullPages = Math.floor(count / pageSize);
  const pageCount = page < maxFullPages ? pageSize : count - maxFullPages * pageSize;
  return pageCount;
}

export function calculateMaxPages(count: number, pageSize: number) {
  return Math.ceil(count / pageSize);
}

export function getResourceId(resource: Pick<Resource, 'resourceId'>) {
  return resource.resourceId;
}

export function extractResourceIdList(resources: Pick<Resource, 'resourceId'>[]) {
  return resources.map(getResourceId);
}

export function toArray<T>(...args: Array<T | T[]>) {
  const arrays = args.map(item => {
    if (Array.isArray(item)) {
      return item;
    } else {
      return [item];
    }
  });
  return flatten(arrays);
}

/** @deprecated cast instead */
export function toNonNullableArray<T>(...args: Array<NonNullable<T | T[]>>) {
  return toArray(...args);
}

/**
 * Returns an array without falsy values like `false`, `null`, `0`, `""`,
 * `undefined`, and `NaN`
 */
export function toCompactArray<T>(...args: Array<T | T[]>) {
  const array = toArray(...args);
  return compact(array as Array<NonNullable<T> | undefined>);
}

export function toUniqArray<T>(...args: Array<T | T[]>) {
  const array = toArray(...args);
  return uniq(array);
}

export function defaultArrayTo<T>(array: T[], data: NonNullable<T | T[]>) {
  return array.length ? array : toCompactArray(data);
}

export function loop<
  TOtherParams extends unknown[],
  TFn extends AnyFn<[number, ...TOtherParams]>,
>(
  fn: TFn,
  /** counting is `0`-index based, so last iteration would be `6` if count is
   * `7`, while first iteration will be `0`. */
  max: number,
  ...otherParams: TOtherParams
) {
  appAssert(max >= 0);

  for (let i = 0; i < max; i++) {
    fn(i, ...otherParams);
  }
}

/**
 * - `all` - uses `Promise.all()`
 * - `allSettled` - uses `Promise.allSettled()`
 * - `oneByOne` - invokes and waits for `fn` one at a time
 */
export type LoopAsyncSettlementType = 'all' | 'allSettled' | 'oneByOne';

/** See {@link loop} */
export async function loopAsync<
  TOtherParams extends unknown[],
  TFn extends AnyFn<[number, ...TOtherParams]>,
>(
  fn: TFn,
  max: number,
  settlement: LoopAsyncSettlementType,
  ...otherParams: TOtherParams
) {
  appAssert(max >= 0);

  if (settlement === 'oneByOne') {
    for (let i = 0; i < max; i++) {
      await fn(i, ...otherParams);
    }
  } else {
    const promises: Array<Promise<unknown>> = Array(max);

    for (let i = 0; i < max; i++) {
      promises.push(fn(i, ...otherParams));
    }

    if (settlement === 'all') {
      await Promise.all(promises);
    } else if (settlement === 'allSettled') {
      await Promise.allSettled(promises);
    } else {
      throw kReuseableErrors.common.invalidState(`Unknown settlement type ${settlement}`);
    }
  }
}

/**
 * See {@link loop}
 * Returns a list containing results of `fn` invocations
 */
export function loopAndCollate<
  TOtherParams extends unknown[],
  TFn extends AnyFn<[number, ...TOtherParams]>,
>(fn: TFn, max: number, ...otherParams: TOtherParams): Array<ReturnType<TFn>> {
  appAssert(max >= 0);
  const result: Array<ReturnType<TFn>> = Array(max);

  for (let i = 0; i < max; i++) {
    result[i] = fn(i, ...otherParams);
  }

  return result;
}

/**
 * See {@link loopAndCollate}
 * Returns a list containing results of `fn` invocations
 */
export async function loopAndCollateAsync<
  TOtherParams extends unknown[],
  TFn extends AnyFn<[number, ...TOtherParams]>,
  TSettlementType extends LoopAsyncSettlementType,
  TResult = TSettlementType extends 'allSettled'
    ? PromiseSettledResult<Awaited<ReturnType<TFn>>>[]
    : Awaited<ReturnType<TFn>>[],
>(
  fn: TFn,
  max: number,
  settlement: TSettlementType,
  ...otherParams: TOtherParams
): Promise<TResult> {
  appAssert(max >= 0);

  if (settlement === 'oneByOne') {
    const result: unknown[] = Array(max);

    for (let i = 0; i < max; i++) {
      result[i] = await fn(i, ...otherParams);
    }

    return result as TResult;
  } else {
    const promises: unknown[] = Array(max);

    for (let i = 0; i < max; i++) {
      promises[i] = fn(i, ...otherParams);
    }

    if (settlement === 'all') {
      return (await Promise.all(promises)) as TResult;
    } else if (settlement === 'allSettled') {
      return (await Promise.allSettled(promises)) as TResult;
    }
  }

  throw kReuseableErrors.common.invalidState(`Unknown settlement type ${settlement}`);
}

export function pick00<T>(data: T, keys: Array<keyof T>) {
  return keys.reduce((map, key) => {
    map[key] = data[key];
    return map;
  }, {} as Partial<T>);
}

export function multilineTextToParagraph(text: string) {
  return text.replace(/[\s]+/g, ' ').trim();
}

export function sortStringListLexographically(stringList: string[]) {
  return stringList.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

export function getFileExtenstion(name = '') {
  const i = name.indexOf('.');
  if (i !== -1) return name.slice(i + 1);
  return undefined;
}

export function getIgnoreCaseRegExpForString(str: string) {
  return new RegExp(`^${str}$`, 'i');
}

export function isStringEqual(
  str00: string | undefined,
  str01: string | undefined,
  useLowercase = true
) {
  if (useLowercase) {
    return str00?.toLowerCase() === str01?.toLowerCase();
  } else {
    return str00 === str01;
  }
}

export function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', chunk => {
      chunks.push(Buffer.from(chunk));
    });
    stream.on('error', err => {
      reject(err);
    });
    stream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
  });
}

/** Returns a function that calls input functions in parallel with any arguments
 * passed to it. */
export function overArgsAsync<
  TFn extends AnyFn,
  TUsePromiseSettled extends boolean,
  TTransformFn extends AnyFn<
    [
      TUsePromiseSettled extends true
        ? Array<PromiseSettledResult<Awaited<ReturnType<TFn>>>>
        : Array<Awaited<ReturnType<TFn>>>,
    ]
  >,
>(
  fns: TFn[],
  /** Whether to use `Promise.allSettled()` or `Promise.all()` */
  usePromiseSettled: TUsePromiseSettled,
  transformFn: TTransformFn
) {
  return async (...args: Parameters<TFn>): Promise<Awaited<ReturnType<TTransformFn>>> => {
    const promises = fns.map(fn => fn(...args));
    const result = await (usePromiseSettled
      ? Promise.allSettled(promises)
      : Promise.all(promises));
    return transformFn(result);
  };
}

export interface IMergeDataMeta {
  /**
   * `merge` - Lodash's default, check out Lodash's `mergeWith` for details.
   * `concat` - Joins both arrays, returning a new array.
   * `replace` - Replaces the old array with the new array value.
   * `retain` - Retains the old array value.
   */
  arrayUpdateStrategy: 'merge' | 'concat' | 'replace' | 'retain';
}

export interface IMergeDataMetaExported {
  meta?: IMergeDataMeta;
}

export const mergeData = <ResourceType = unknown>(
  resource: ResourceType,
  data: Partial<ResourceType>,
  meta: IMergeDataMeta = {arrayUpdateStrategy: 'replace'}
) => {
  const result = mergeWith(resource, data, (objValue, srcValue) => {
    if (Array.isArray(objValue) && srcValue) {
      if (meta.arrayUpdateStrategy === 'concat') {
        return objValue.concat(srcValue);
      } else if (meta.arrayUpdateStrategy === 'replace') {
        return srcValue;
      } else if (meta.arrayUpdateStrategy === 'retain') {
        return objValue;
      }

      // No need to handle the "merge" arrayUpdateStrategy, it happens by
      // default if nothing is returned
    }
  });

  return result;
};

/** Returns a function that calls `afterFn` with the result of, and arguments of
 * `fn`. */
export function callAfterAsync<
  TFn extends AnyFn,
  TAfterFn extends AnyFn<[Awaited<ReturnType<TFn>>, ...Parameters<TFn>]>,
>(fn: TFn, afterFn: TAfterFn) {
  return async (...args: Parameters<TFn>) => {
    const result = await fn(...args);
    return await afterFn(result, ...args);
  };
}

export function identityArgs<TArgs extends unknown[]>(...args: TArgs) {
  return args;
}

export function omitDeep(data: AnyObject, byFn: AnyFn<[unknown], boolean>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = isArray(data) ? [] : isObject(data) ? {} : undefined;
  appAssert(result);

  for (const key in data) {
    let value = data[key];

    if (!byFn(value)) {
      if (isObject(value)) {
        value = omitDeep(value, byFn);
      }

      result[key] = value;
    }
  }

  return result;
}

export function pathJoin(...args: Array<string | string[]>) {
  let pJoined = path.posix.join(
    ...args.map(arg => (isArray(arg) ? arg.join(kFolderConstants.separator) : arg))
  );

  if (pJoined.match(/^[./]*$/) || !pJoined) {
    return '';
  }

  const parsed = path.posix.parse(pJoined);
  pJoined = path.posix.normalize(parsed.dir + kFolderConstants.separator + parsed.base);

  if (pJoined[0] !== kFolderConstants.separator) {
    pJoined = kFolderConstants.separator + pJoined;
  }

  if (pJoined[pJoined.length - 1] === kFolderConstants.separator) {
    pJoined = pJoined.slice(0, -1);
  }

  return pJoined;
}

export function pathSplit(input: string = '') {
  return compact(input.split(kFolderConstants.separator));
}

export function isPathEmpty(input: string | string[]) {
  const pJoined = pathJoin(input, 'E');
  return pJoined === '/E';
}

export function pathExtension(input: string) {
  return path.posix.extname(input).replace('.', '');
}

export function pathBasename(input: string) {
  const ext = pathExtension(input);
  let basename = path.posix.basename(input, `.${ext}`);

  if (basename.match(/^[.]*$/)) {
    basename = '';
  }

  return {basename, ext};
}
