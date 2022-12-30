import {compact} from 'lodash';
import {indexArray} from './indexArray';
import {AnyObject} from './types';

export function cast<ToType>(resource: any): ToType {
  return resource as unknown as ToType;
}

export function isObjectEmpty(data: Record<string | number, any>) {
  return Object.keys(data).length === 0;
}

export function getFirstArg<T extends any[]>(...args: T): T[0] {
  return args[0];
}

/* eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars */
export async function noopAsync(...args: any) {}

export function applyMixins(derivedConstructors: any, baseConstructors: any[]) {
  baseConstructors.forEach(baseConstructor => {
    Object.getOwnPropertyNames(baseConstructor.prototype).forEach(name => {
      if (name !== 'constructor') {
        derivedConstructors.prototype[name] = baseConstructor.prototype[name];
      }
    });
  });
}

export function applyMixins02<C1, C2>(derivedConstructors: C1, baseConstructors: [C2]): C1 & C2 {
  return cast(applyMixins(derivedConstructors, baseConstructors));
}

export function applyMixins03<C1, C2, C3>(derivedConstructors: C1, baseConstructors: [C2, C3]): C1 & C2 & C3 {
  return cast(applyMixins(derivedConstructors, baseConstructors));
}

export function applyMixins04<C1, C2, C3, C4>(
  derivedConstructors: C1,
  baseConstructors: [C2, C3, C4]
): C1 & C2 & C3 & C4 {
  return cast(applyMixins(derivedConstructors, baseConstructors));
}

export function findItemWithField<T>(items: T[], val: any, field: keyof T): T | undefined {
  return items.find(item => {
    return item[field] === val;
  });
}

export function makeKey(fields: any[], separator = '-', omitFalsy = true) {
  if (omitFalsy) {
    fields = compact(fields);
  }

  return fields.join(separator);
}

export function objectHasData(data: AnyObject) {
  return Object.keys(data).length > 0;
}

export function waitTimeout(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function reverseMap<K extends string, V extends string>(m: Record<K, V>): Record<V, K> {
  const r: Record<V, K> = cast<Record<V, K>>({});
  for (const k in m) {
    r[m[k]] = k;
  }
  return r;
}

export function containsEveryItemIn<T2, T1 extends T2>(list1: T1[], list2: T2[], indexer: (item: T2) => string) {
  const list1Map = indexArray(list1, {indexer});
  list2.forEach(item1 => {
    const k = indexer(item1);
    const item2 = list1Map[k];
    expect(item2).toBeTruthy();
  });
}

export function containsNoneIn<T2, T1 extends T2>(list1: T1[], list2: T2[], indexer: (item: T2) => string) {
  const list1Map = indexArray(list1, {indexer});
  list2.forEach(item1 => {
    const k = indexer(item1);
    const item2 = list1Map[k];
    expect(item2).toBeFalsy();
  });
}

export function containsExactly<T2, T1 extends T2>(list1: T1[], list2: T2[], indexer: (item: T2) => string) {
  expect(list1.length).toEqual(list2.length);
  containsEveryItemIn(list1, list2, indexer);
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
