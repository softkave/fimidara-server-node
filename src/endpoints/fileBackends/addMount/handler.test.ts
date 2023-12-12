import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {kSemanticModels} from '../../contexts/injectables';
import EndpointReusableQueries from '../../queries';
import {completeTest} from '../../testUtils/helpers/test';
import {
  initTest,
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

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest();
});

test('Agent token added', async () => {
  const {userToken} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userToken);
  const {token} = await insertAgentTokenForTest(userToken, workspace.resourceId);
  const savedToken = getPublicAgentToken(
    await populateAssignedTags(
      workspace.resourceId,
      await kSemanticModels
        .agentToken()
        .assertGetOneByQuery(EndpointReusableQueries.getByResourceId(token.resourceId))
    )
  );
  expect(agentTokenExtractor(savedToken)).toMatchObject(token);
});
