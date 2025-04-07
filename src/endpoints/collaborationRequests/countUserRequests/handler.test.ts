import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import RequestData from '../../RequestData.js';
import {generateAndInsertCollaborationRequestListForTest} from '../../testHelpers/generate/collaborationRequest.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
import countUserCollaborationRequests from './handler.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('countUserRequests', () => {
  test('count', async () => {
    const {user: user02, userToken: user02Token} = await insertUserForTest();
    const count = 5;
    await generateAndInsertCollaborationRequestListForTest(count, () => ({
      recipientEmail: user02.email,
    }));
    const reqData = RequestData.fromExpressRequest(
      mockExpressRequestWithAgentToken(user02Token)
    );
    const result = await countUserCollaborationRequests(reqData);
    assertEndpointResultOk(result);
    expect(result.count).toBe(count);
  });
});
