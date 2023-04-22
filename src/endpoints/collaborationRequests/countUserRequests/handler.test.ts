import {BaseContextType} from '../../contexts/types';
import RequestData from '../../RequestData';
import {generateAndInsertCollaborationRequestListForTest} from '../../testUtils/generateData/collaborationRequest';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import countUserCollaborationRequests from './handler';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('countUserRequests', () => {
  test('count', async () => {
    assertContext(context);
    const {user: user02, userToken: user02Token} = await insertUserForTest(context);
    const count = 5;
    await generateAndInsertCollaborationRequestListForTest(context, count, () => ({
      recipientEmail: user02.email,
    }));
    const instData = RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(user02Token));
    const result = await countUserCollaborationRequests(context, instData);
    assertEndpointResultOk(result);
    expect(result.count).toBe(count);
  });
});
