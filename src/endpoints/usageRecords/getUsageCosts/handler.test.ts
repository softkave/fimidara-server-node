import RequestData from '../../RequestData';
import {completeTest} from '../../testUtils/helpers/test';
import {mockExpressRequestForPublicAgent} from '../../testUtils/testUtils';
import {usageCosts} from '../constants';
import getUsageCosts from './handler';
import {GetUsageCostsEndpointParams} from './types';

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest({});
});

describe('getUsageCosts', () => {
  test('should return usage costs', async () => {
    // setup
    const instData = RequestData.fromExpressRequest<GetUsageCostsEndpointParams>(
      mockExpressRequestForPublicAgent(),
      {}
    );

    // run
    const result = await getUsageCosts(instData);

    // verify
    expect(result.costs).toMatchObject(usageCosts);
  });
});
