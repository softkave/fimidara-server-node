import {faker} from '@faker-js/faker';
import {merge, pick} from 'lodash';
import {AnyObject} from 'mongoose';
import {kPermissionsMap} from '../../../definitions/permissionItem';
import {Agent, AppResourceType, kAppResourceType} from '../../../definitions/system';
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
  types: AppResourceType[] = Object.values(kAppResourceType)
) {
  return faker.helpers.arrayElement(types);
}

export function randomAction(actions = Object.values(kPermissionsMap)) {
  return faker.helpers.arrayElement(actions);
}

export function generateAgent(seed: Partial<Agent> = {}): Agent {
  const agentType = kAppResourceType.AgentToken;
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

export enum TestFieldsPresetCombinations {
  /** Generates a total of N combinations where N is the number of keys present
   * in the object, and for each entry, there'd be only one field generated. E.g
   * ```typescript
   * const def = {one: () => 1, two: () => 2};
   * const testFields = [
   *    {one: 1},
   *    {two: 2}
   * ];
   * ``` */
  oneOfEach = 'oneOfEach',
  /** Generates a total of N combinations where N is the number of keys present
   * in the object, and for each entry, there'd be the key and other keys that came before. E.g
   * ```typescript
   * const def = {one: () => 1, two: () => 2, three: () => 3};
   * const testFields = [
   *    {one: 1},
   *    {one: 1, two: 2},
   *    {one: 1, two: 2, three: 3},
   * ];
   * ``` */
  incrementallyAdd = 'incrementallyAdd',
}

export async function generateTestFieldsCombinations<T extends AnyObject>(
  def: GenerateTestFieldsDef<T>,
  factor: TestFieldsPresetCombinations,
  ...otherArgs: unknown[]
): Promise<Array<Partial<T>>> {
  if (factor === TestFieldsPresetCombinations.incrementallyAdd) {
    return await Promise.all(
      Object.keys(def).map((unused, index, keys) => {
        const subDef = pick(def, keys.slice(0, index + 1)) as GenerateTestFieldsDef<T>;
        return generateTestFields<T>(subDef, ...otherArgs);
      })
    );
  } else if (factor === TestFieldsPresetCombinations.oneOfEach) {
    return await Promise.all(
      Object.keys(def).map(key => {
        const subDef = pick(def, [key]) as GenerateTestFieldsDef<T>;
        return generateTestFields<T>(subDef, ...otherArgs);
      })
    );
  }

  return [];
}

export interface MatchGenerate<TData, TContexts extends unknown[] = unknown[]> {
  matcher: AnyFn<TContexts, OrPromise<boolean>>;
  generator: AnyFn<TContexts, OrPromise<TData>>;
}

export async function matchGenerators<TData, TContexts extends unknown[]>(
  generators: Array<MatchGenerate<TData, TContexts>>,
  ...args: TContexts
) {
  for (const {generator, matcher} of generators) {
    const matches = await matcher(...args);

    if (matches) {
      return generator(...args);
    }
  }

  return undefined;
}
