import RequestData from '../../RequestData.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {initTests, mockExpressRequestForPublicAgent} from '../../testUtils/testUtils.js';
import {usageCosts} from '../constants.js';
import getUsageCosts from './handler.js';
import {GetUsageCostsEndpointParams} from './types.js';
import {test, beforeAll, afterAll, describe, expect} from 'vitest';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
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
