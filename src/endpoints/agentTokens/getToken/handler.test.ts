import {BaseContextType} from '../../contexts/types';
import RequestData from '../../RequestData';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertAgentTokenForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import getAgentToken from './handler';
import {GetAgentTokenEndpointParams} from './types';

/**
 * TODO:
 * - [Low] Check that onReferenced feature works
 */

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

test('referenced agent token returned', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {token: token01} = await insertAgentTokenForTest(context, userToken, workspace.resourceId);

  const instData = RequestData.fromExpressRequest<GetAgentTokenEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {tokenId: token01.resourceId, workspaceId: workspace.resourceId}
  );
  const result = await getAgentToken(context, instData);
  assertEndpointResultOk(result);
  expect(result.token).toEqual(token01);
});
