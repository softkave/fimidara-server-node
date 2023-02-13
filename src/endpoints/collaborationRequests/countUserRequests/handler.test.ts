import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {generateAndInsertCollaborationRequestListForTest} from '../../test-utils/generate-data/collaborationRequest';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import countUserCollaborationRequests from './handler';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('countUserRequests', () => {
  test('count', async () => {
    assertContext(context);
    const {user: user02, userToken: user02Token} = await insertUserForTest(context);
    const count = 5;
    await generateAndInsertCollaborationRequestListForTest(context, count, () => ({recipientEmail: user02.email}));
    const instData = RequestData.fromExpressRequest(mockExpressRequestWithUserToken(user02Token));
    const result = await countUserCollaborationRequests(context, instData);
    assertEndpointResultOk(result);
    expect(result.count).toBe(count);
  });
});
