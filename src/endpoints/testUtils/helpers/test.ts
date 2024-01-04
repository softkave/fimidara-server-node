import assert from 'assert';
import {get, noop} from 'lodash';
import {
  calculateMaxPages,
  calculatePageSize,
  getRandomInt,
  toArray,
} from '../../../utils/fns';
import {AnyFn, AnyObject, OrArray, OrPromise} from '../../../utils/types';
import RequestData from '../../RequestData';
import {globalDispose} from '../../contexts/globalUtils';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {registerInjectables} from '../../contexts/injection/register';
import {SemanticProviderMutationRunOptions} from '../../contexts/semantic/types';
import {IServerRequest} from '../../contexts/types';
import {setupApp} from '../../runtime/initAppSetup';
import {
  Endpoint,
  InferEndpointParams,
  InferEndpointResult,
  PaginatedResult,
  PaginationQuery,
} from '../../types';
import {assertEndpointResultOk} from '../testUtils';

export function mutationTest(
  name: string,
  fn: AnyFn<[SemanticProviderMutationRunOptions]>,
  timeout?: number
) {
  kSemanticModels.utils().withTxn(async options => {
    await test(name, () => fn(options), timeout);
  });
}

export async function completeTests() {
  await globalDispose();
}

export function startTesting() {
  beforeAll(async () => {
    registerInjectables();
    await setupApp();
  });

  afterAll(async () => {
    await globalDispose();
  });
}

export function softkaveTest(name: string, fn: AnyFn, timeout?: number) {
  test(
    name,
    async () => {
      await kUtilsInjectables.asyncLocalStorage().run(fn);
    },
    timeout
  );
}

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function performPaginationTest<T extends Endpoint<any, PaginatedResult>>(
  endpoint: T,
  props: PerformPaginationTestParams<T>
) {
  const {params, req, count, fields, otherTestsFn = noop} = props;
  assert(params);

  const pageSize = props.pageSize || getRandomInt(1, count);
  const maxPages = calculateMaxPages(count, pageSize);

  // Add an extra page to test that final page returns 0 items
  for (let page = 0; page <= maxPages; page++) {
    const instData = RequestData.fromExpressRequest(req, {page, pageSize, ...params});
    const result = await endpoint(instData);
    assertEndpointResultOk(result);

    // Seeing page is 0-based, when page === maxPages, expectedPageSize should
    // be 0
    const expectedPageSize =
      page < maxPages ? calculatePageSize(count, pageSize, page) : 0;
    expect(result.page).toBe(page);
    toArray(fields).forEach(field => {
      expect(get(result, field)).toHaveLength(expectedPageSize);
    });
    otherTestsFn(result as InferEndpointResult<T>);
  }
}

export function expectFields<T extends AnyObject>(mounts: T[], fields: Partial<T>) {
  mounts.forEach(mount => {
    for (const key in fields) {
      const value = fields[key as keyof T];
      expect(mount[key as keyof T]).toBe(value);
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
  await Promise.all(
    expects.map(async ({matcher, expect}) => {
      const matches = matcher(...args);

      if (matches) {
        expect(...args);
      }
    })
  );
}

export async function testCombinations<TCombination extends AnyObject>(
  combinations: TCombination[],
  fn: AnyFn<[TCombination]>
) {
  for (const combination of combinations) {
    await fn(combination);
    // try {
    // } catch (error) {
    //   const message =
    //     `with updates ${Object.keys(combination).join(',')}\n` +
    //     (error as Error)?.message;
    //   // (error as Error).message = message;
    //   throw new Error(message);
    // }
  }
}
