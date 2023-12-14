import {compact, flatten, uniq} from 'lodash';
import {Readable} from 'stream';
import {Resource} from '../definitions/system';
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

export function loop(count = 1, fn: AnyFn) {
  while (count > 0) {
    fn();
    count -= 1;
  }
}

export function loopAndCollate<Fn extends AnyFn>(
  count = 1,
  fn: Fn
): Array<ReturnType<Fn>> {
  const result: Array<ReturnType<Fn>> = [];
  while (count > 0) {
    result.push(fn());
    count -= 1;
  }
  return result;
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

export function getLowercaseRegExpForString(str: string) {
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

export async function parallelFlowAsync<T extends AnyFn>(fns: T[]) {
  return async (
    ...args: Parameters<T>
  ): Promise<Array<PromiseSettledResult<ReturnType<Awaited<T>>>>> => {
    return await Promise.allSettled(fns.map(fn => fn(...args)));
  };
}
