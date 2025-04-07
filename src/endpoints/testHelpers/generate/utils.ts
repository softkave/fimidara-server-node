import {faker} from '@faker-js/faker';
import {isObjectLike, pick} from 'lodash-es';
import {AnyFn, AnyObject, OrPromise} from 'softkave-js-utils';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {
  Agent,
  FimidaraResourceType,
  kFimidaraResourceType,
} from '../../../definitions/system.js';
import {mergeData} from '../../../utils/fns.js';
import {getNewIdForResource} from '../../../utils/resource.js';

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
    const item = isObjectLike(f)
      ? mergeData(f, generatePartialDataFn(i, f, cache), {
          arrayUpdateStrategy: 'replace',
        })
      : f;
    data.push(item);
  }
  return data;
}

export function randomResourceType(
  types: FimidaraResourceType[] = Object.values(kFimidaraResourceType)
) {
  return faker.helpers.arrayElement(types);
}

export function randomAction(
  actions = Object.values(kFimidaraPermissionActions)
) {
  return faker.helpers.arrayElement(actions);
}

export function randomActionList(
  actions = Object.values(kFimidaraPermissionActions)
) {
  return faker.helpers.arrayElements(actions);
}

export function generateAgent(seed: Partial<Agent> = {}): Agent {
  const agentType = kFimidaraResourceType.AgentToken;
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
      acc[key] = await genFn(key, ...otherArgs);
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
        const subDef = pick(
          def,
          keys.slice(0, index + 1)
        ) as GenerateTestFieldsDef<T>;
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
