import {compact, flatten} from 'lodash';
import {
  AppResourceType,
  IAgent,
  IResource,
  ISessionAgent,
  IWorkspaceResource,
} from '../definitions/system';
import {getTimestamp} from './dateFns';
import {getNewIdForResource} from './resource';
import {getActionAgentFromSessionAgent, isSessionAgent} from './sessionUtils';
import {AnyFn, AnyObject} from './types';

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

export function calculatePageSize(count: number, pageSize: number, page: number) {
  count = Math.max(count, 0);
  pageSize = Math.max(pageSize, 0);
  page = Math.max(page, 0);
  if (count === 0 ?? pageSize === 0) return 0;
  const maxFullPages = Math.floor(count / pageSize);
  const pageCount = page < maxFullPages ? pageSize : count - maxFullPages * pageSize;
  return pageCount;
}

export function getResourceId(resource: Pick<IResource, 'resourceId'>) {
  return resource.resourceId;
}

export function extractResourceIdList(resources: Pick<IResource, 'resourceId'>[]) {
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

export function toNonNullableArray<T>(...args: Array<NonNullable<T | T[]>>) {
  return toArray(...args);
}

export function toCompactArray<T>(...args: Array<T | T[]>) {
  const array = toArray(...args);
  return compact(array as Array<NonNullable<T> | undefined>);
}

export function defaultArrayTo<T>(array: T[], data: NonNullable<T | T[]>) {
  return array.length ? array : toCompactArray(data);
}

export function newResource<T extends AnyObject>(
  type: AppResourceType,
  seed?: Omit<T, keyof IResource> & Partial<IResource>
): IResource & T {
  const createdAt = getTimestamp();
  return {
    createdAt,
    resourceId: getNewIdForResource(type),
    lastUpdatedAt: createdAt,
    ...seed,
  } as IResource & T;
}

export function newWorkspaceResource<T extends AnyObject>(
  agent: IAgent | ISessionAgent,
  type: AppResourceType,
  workspaceId: string,
  seed?: Omit<T, keyof IWorkspaceResource> & Partial<IWorkspaceResource>
): IWorkspaceResource & T {
  const createdBy = isSessionAgent(agent) ? getActionAgentFromSessionAgent(agent) : agent;
  const createdAt = getTimestamp();
  const item: IWorkspaceResource = {
    createdBy,
    createdAt,
    workspaceId,
    resourceId: getNewIdForResource(type),
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    ...seed,
  };
  return item as T & IWorkspaceResource;
}

export function loop(count = 1, fn: AnyFn) {
  while (count > 0) {
    fn();
    count -= 1;
  }
}

export function loopAndCollate<Fn extends AnyFn>(count = 1, fn: Fn): Array<ReturnType<Fn>> {
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
