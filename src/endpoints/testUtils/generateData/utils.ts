import {faker} from '@faker-js/faker';
import {merge, pick} from 'lodash';
import {AnyObject} from 'mongoose';
import {kPermissionsMap} from '../../../definitions/permissionItem';
import {Agent, AppResourceType, AppResourceTypeMap} from '../../../definitions/system';
import {getNewIdForResource} from '../../../utils/resource';
import {AnyFn, OrPromise} from '../../../utils/types';

export type GeneratePartialTestDataFn<T> = (
  index: number,
  indexItem: T,
  cache: Record<string, unknown>
) => Partial<T>;

export const defaultGeneratePartialTestDataFn: GeneratePartialTestDataFn<
  unknown
> = () => ({});

export function generateTestList<
  T,
  TCache extends Record<string, unknown> = Record<string, unknown>,
>(
  generareFullDataFn: (index: number, cache: Record<string, unknown>) => T,
  count = 20,
  generatePartialDataFn: GeneratePartialTestDataFn<T> = () => ({}),
  cache: TCache = {} as TCache
) {
  const data: T[] = [];
  for (let i = 0; i < count; i++) {
    const f = generareFullDataFn(i, cache);
    const item = merge(f, generatePartialDataFn(i, f, cache));
    data.push(item);
  }
  return data;
}

export function randomResourceType(
  types: AppResourceType[] = Object.values(AppResourceTypeMap)
) {
  return faker.helpers.arrayElement(types);
}

export function randomAction(actions = Object.values(kPermissionsMap)) {
  return faker.helpers.arrayElement(actions);
}

export function generateAgent(seed: Partial<Agent> = {}): Agent {
  const agentType = AppResourceTypeMap.AgentToken;
  const agentTokenId = getNewIdForResource(agentType);
  return {
    agentType,
    agentTokenId,
    agentId: agentTokenId,
    ...seed,
  };
}

export type GenerateTestFieldsDef<
  T extends AnyObject,
  TOtherArgs extends unknown[] = unknown[],
> = {
  [K in keyof T]: AnyFn<[K, ...TOtherArgs], OrPromise<T[K]>>;
};

export async function generateTestFields<T extends AnyObject>(
  def: GenerateTestFieldsDef<T>,
  ...otherArgs: unknown[]
): Promise<Partial<T>> {
  const acc: AnyObject = {};
  await Promise.all(
    Object.entries(def).map(async ([key, genFn]) => {
      acc[key] = genFn(key, ...otherArgs);
      return acc;
    })
  );

  return acc as Partial<T>;
}

export async function generateTestFieldsCombinations<T extends AnyObject>(
  def: GenerateTestFieldsDef<T>,
  ...otherArgs: unknown[]
): Promise<Array<Partial<T>>> {
  return await Promise.all(
    Object.keys(def).map((unused, index, keys) => {
      const subDef = pick(def, keys.slice(0, index + 1)) as GenerateTestFieldsDef<T>;
      return generateTestFields<T>(subDef, ...otherArgs);
    })
  );
}
