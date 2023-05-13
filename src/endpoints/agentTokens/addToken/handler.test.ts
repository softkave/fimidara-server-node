import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {BaseContextType} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  initTestBaseContext,
  insertAgentTokenForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../testUtils/testUtils';
import {agentTokenExtractor, getPublicAgentToken} from '../utils';

/**
 * TODO:
 * [Low] - Test that hanlder fails if token exists
 * [Low] - Test that hanlder fails if permissionGroups don't exist
 */

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

test('Agent token added', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {token} = await insertAgentTokenForTest(context, userToken, workspace.resourceId);
  const savedToken = getPublicAgentToken(
    context,
    await populateAssignedTags(
      context,
      workspace.resourceId,
      await context.semantic.agentToken.assertGetOneByQuery(
        EndpointReusableQueries.getByResourceId(token.resourceId)
      )
    )
  );
  expect(agentTokenExtractor(savedToken)).toMatchObject(token);
});
