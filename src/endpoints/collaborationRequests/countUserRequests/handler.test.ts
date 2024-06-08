import RequestData from '../../RequestData.js';
import {generateAndInsertCollaborationRequestListForTest} from '../../testUtils/generate/collaborationRequest.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {test, beforeAll, afterAll, describe, expect} from 'vitest';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
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
    const instData = RequestData.fromExpressRequest(
      mockExpressRequestWithAgentToken(user02Token)
    );
    const result = await countUserCollaborationRequests(instData);
    assertEndpointResultOk(result);
    expect(result.count).toBe(count);
  });
});
