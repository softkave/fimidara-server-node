import {IBaseContext} from '../../contexts/types';
import {disposeGlobalUtils} from '../../globalUtils';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertAgentTokenForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import deleteAgentToken from './handler';
import {IDeleteAgentTokenEndpointParams} from './types';

/**
 * TODO:
 * - [Low] Check that onReferenced feature works
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
  await disposeGlobalUtils();
});

test('program access token deleted', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {token} = await insertAgentTokenForTest(context, userToken, workspace.resourceId);
  const instData = RequestData.fromExpressRequest<IDeleteAgentTokenEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {
      tokenId: token.resourceId,
    }
  );

  const result = await deleteAgentToken(context, instData);
  assertEndpointResultOk(result);
  const deletedTokenExists = await context.semantic.agentToken.existsByQuery(
    EndpointReusableQueries.getByResourceId(token.resourceId)
  );

  expect(deletedTokenExists).toBeFalsy();
});
