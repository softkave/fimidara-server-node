import assert from 'assert';
import {findLastIndex, get, isFunction, noop} from 'lodash-es';
import {
  AnyFn,
  AnyObject,
  calculateMaxPages,
  calculatePageSize,
  convertToArray,
  getRandomInt,
  OrArray,
  OrPromise,
} from 'softkave-js-utils';
import {afterAll, beforeAll, expect, test} from 'vitest';
import {globalDispose, globalSetup} from '../../../contexts/globalUtils.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {SemanticProviderMutationParams} from '../../../contexts/semantic/types.js';
import {IServerRequest} from '../../../contexts/types.js';
import RequestData from '../../RequestData.js';
import {initFimidara} from '../../runtime/initFimidara.js';
import {
  Endpoint,
  InferEndpointParams,
  InferEndpointResult,
  PaginatedResult,
  PaginationQuery,
} from '../../types.js';
import {assertEndpointResultOk} from '../utils.js';

export function mutationTest(
  name: string,
  fn: AnyFn<[SemanticProviderMutationParams]>,
  timeout?: number
) {
  kIjxSemantic.utils().withTxn(async options => {
    await test(name, () => fn(options), timeout);
  });
}

export async function completeTests() {
  await globalDispose();
}

export function startTesting() {
  beforeAll(async () => {
    await globalSetup(
      {useFimidaraApp: false, useFimidaraWorkerPool: false},
      {
        useHandleFolderQueue: true,
        useHandleUsageRecordQueue: true,
        useHandleAddInternalMultipartIdQueue: true,
        useHandlePrepareFileQueue: true,
      }
    );
    await initFimidara();
  });

  afterAll(async () => {
    await globalDispose();
  });
}

type TestFn = (name: string, fn: AnyFn, timeout?: number) => void;

export interface SoftkaveTest {
  run: TestFn;
  only: TestFn;
  each: typeof test.each;
}

export const skTest: SoftkaveTest = {
  run: (name: string, fn: AnyFn, timeout?: number) => {
    test(
      name,
      async () => {
        await kIjxUtils.asyncLocalStorage().run(fn);
      },
      timeout
    );
  },
  only: (name: string, fn: AnyFn, timeout?: number) => {
    test.only(
      name,
      async () => {
        await kIjxUtils.asyncLocalStorage().run(fn);
      },
      timeout
    );
  },
  each: (cases: unknown) => {
    return (...testArgs: unknown[]) => {
      const fnIndex = findLastIndex(testArgs, isFunction);
      const fn = testArgs[fnIndex];
      assert(isFunction(fn), 'No test function');
      testArgs[fnIndex] = async (...args: unknown[]) => {
        await kIjxUtils.asyncLocalStorage().run(() => fn(...args));
      };

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      test.each(cases)(...testArgs);
    };
  },
};

export interface PerformPaginationTestParams<
  T extends Endpoint<AnyObject, PaginatedResult>,
> {
  params: Omit<InferEndpointParams<T>, keyof PaginationQuery>;
  otherTestsFn?: AnyFn<[InferEndpointResult<T>]>;
  req: IServerRequest;
  count: number;
  pageSize?: number;
  fields: OrArray<keyof InferEndpointResult<T>>;
}

export async function performPaginationTest<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends Endpoint<any, PaginatedResult>,
>(endpoint: T, props: PerformPaginationTestParams<T>) {
  const {params, req, count, fields, otherTestsFn = noop} = props;
  assert(params);

  const pageSize = props.pageSize || getRandomInt(1, count);
  const maxPages = calculateMaxPages(count, pageSize);

  // Add an extra page to test that final page returns 0 items
  for (let page = 0; page <= maxPages; page++) {
    const reqData = RequestData.fromExpressRequest(req, {
      page,
      pageSize,
      ...params,
    });
    const result = await endpoint(reqData);
    assertEndpointResultOk(result);

    // Seeing page is 0-based, when page === maxPages, expectedPageSize should
    // be 0
    const expectedPageSize =
      page < maxPages ? calculatePageSize(count, pageSize, page) : 0;
    expect(result.page).toBe(page);
    convertToArray(fields).forEach(field => {
      expect(get(result, field)).toHaveLength(expectedPageSize);
    });
    otherTestsFn(result as InferEndpointResult<T>);
  }
}

export function expectFields<T extends AnyObject>(
  resources: T[],
  fields: Partial<T>
) {
  resources.forEach(resource => {
    for (const key in fields) {
      const expectedValue = fields[key as keyof T];
      const receivedValue = resource[key as keyof T];
      expect({[key]: expectedValue}).toEqual({[key]: receivedValue});
    }
  });
}

export interface MatchExpect<TContexts extends unknown[] = unknown[]> {
  matcher: AnyFn<TContexts, OrPromise<boolean>>;
  expect: AnyFn<TContexts, OrPromise<void>>;
}

export async function matchExpects<TContexts extends unknown[]>(
  expects: Array<MatchExpect<TContexts>>,
  ...args: TContexts
) {
  for (const {matcher, expect} of expects) {
    const matches = await matcher(...args);

    if (matches) {
      await expect(...args);
    }
  }
}

export async function testCombinations<TCombination extends AnyObject>(
  combinations: TCombination[],
  fn: AnyFn<[TCombination]>
) {
  for (const combination of combinations) {
    await fn(combination);
  }
}
