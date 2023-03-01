import {compact} from 'lodash';
import {AppResourceType, IAgent, IResourceBase, ISessionAgent} from '../definitions/system';
import {appAssert} from './assertion';
import {getTimestamp} from './dateFns';
import {ServerError} from './errors';
import {getNewIdForResource} from './resourceId';
import {getActionAgentFromSessionAgent, isSessionAgent} from './sessionUtils';
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

export function getResourceId(resource: IResourceBase) {
  return resource.resourceId;
}

export function extractResourceIdList(resources: IResourceBase[]) {
  return resources.map(getResourceId);
}

export function toArray<T>(item: T | T[]) {
  if (Array.isArray(item)) {
    return item;
  } else {
    return [item];
  }
}

export const stopControlFlow = (): any =>
  appAssert(false, new ServerError(), "Control shouldn't get here.");

export function newResource<T extends AnyObject = AnyObject>(
  agent: IAgent | ISessionAgent,
  type: AppResourceType,
  seed?: T
): IResourceBase & T {
  const createdBy = isSessionAgent(agent) ? getActionAgentFromSessionAgent(agent) : agent;
  const createdAt = getTimestamp();
  return {
    createdBy,
    createdAt,
    resourceId: getNewIdForResource(type),
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    ...seed,
  } as IResourceBase & T;
}
