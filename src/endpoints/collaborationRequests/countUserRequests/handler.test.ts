import RequestData from '../../RequestData';
import {generateAndInsertCollaborationRequestListForTest} from '../../testUtils/generateData/collaborationRequest';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import countUserCollaborationRequests from './handler';

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
