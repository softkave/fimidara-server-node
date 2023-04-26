import {BaseContextType} from '../../contexts/types';
import RequestData from '../../RequestData';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  initTestBaseContext,
  mockExpressRequestForPublicAgent,
} from '../../testUtils/testUtils';
import {usageCosts} from '../constants';
import getUsageCosts from './handler';
import {GetUsageCostsEndpointParams} from './types';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('getUsageCosts', () => {
  test('should return usage costs', async () => {
    // setup
    const instData = RequestData.fromExpressRequest<GetUsageCostsEndpointParams>(
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
