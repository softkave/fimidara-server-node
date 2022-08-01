import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  initTestBaseContext,
  mockExpressRequestForPublicAgent,
} from '../../test-utils/test-utils';
import {usageCosts} from '../constants';
import getUsageCosts from './handler';
import {IGetUsageCostsEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('getUsageCosts', () => {
  test('should return usage costs', async () => {
    // setup
    const instData =
      RequestData.fromExpressRequest<IGetUsageCostsEndpointParams>(
        mockExpressRequestForPublicAgent(),
        {}
      );

    assertContext(context);

    // run
    const result = await getUsageCosts(context, instData);

    // verify
    expect(result.costs).toMatchObject(usageCosts);
  });
});
