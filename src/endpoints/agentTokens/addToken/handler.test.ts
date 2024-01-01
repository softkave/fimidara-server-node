import {kSemanticModels} from '../../contexts/injection/injectables';
import {completeTests} from '../../testUtils/helpers/test';
import {
  initTests,
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
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

test('Agent token added', async () => {
  const {userToken} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userToken);
  const {token} = await insertAgentTokenForTest(userToken, workspace.resourceId);
  const savedToken = getPublicAgentToken(
    await kSemanticModels.agentToken().assertGetOneByQuery({resourceId: token.resourceId})
  );
  expect(agentTokenExtractor(savedToken)).toMatchObject(token);
});
