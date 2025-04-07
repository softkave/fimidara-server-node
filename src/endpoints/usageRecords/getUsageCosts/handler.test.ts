import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import RequestData from '../../RequestData.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  initTests,
  mockExpressRequestForPublicAgent,
} from '../../testHelpers/utils.js';
import {kUsageCostsPerByte} from '../constants.js';
import getUsageCosts from './handler.js';
import {GetUsageCostsEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('getUsageCosts', () => {
  test('should return usage costs', async () => {
    // setup
    const reqData = RequestData.fromExpressRequest<GetUsageCostsEndpointParams>(
      mockExpressRequestForPublicAgent(),
      {}
    );

    // run
    const result = await getUsageCosts(reqData);

    // verify
    expect(result.costs).toMatchObject(kUsageCostsPerByte);
  });
});
