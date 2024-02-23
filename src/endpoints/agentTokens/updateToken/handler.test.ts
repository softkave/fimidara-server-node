import {faker} from '@faker-js/faker';
import RequestData from '../../RequestData';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {kSemanticModels} from '../../contexts/injection/injectables';
import EndpointReusableQueries from '../../queries';
import {completeTests} from '../../testUtils/helpers/testFns';
import {
  assertEndpointResultOk,
  initTests,
  insertAgentTokenForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {agentTokenExtractor, getPublicAgentToken} from '../utils';
import updateAgentToken from './handler';
import {UpdateAgentTokenEndpointParams, UpdateAgentTokenInput} from './types';

/**
 * TODO:
 * - [Low] Test that hanlder fails if permissionGroups doesn't exist
 * - [Low] Test that onReferenced feature works
 */

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

test('agent token updated', async () => {
  const {userToken} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userToken);
  const {token: token01} = await insertAgentTokenForTest(userToken, workspace.resourceId);
  const tokenUpdateInput: UpdateAgentTokenInput = {
    name: faker.lorem.words(10),
    description: faker.lorem.words(10),
  };

  const instData = RequestData.fromExpressRequest<UpdateAgentTokenEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {
      tokenId: token01.resourceId,
      token: tokenUpdateInput,
      workspaceId: workspace.resourceId,
    }
  );
  const result = await updateAgentToken(instData);
  assertEndpointResultOk(result);

  const updatedToken = getPublicAgentToken(
    await populateAssignedTags(
      workspace.resourceId,
      await kSemanticModels
        .agentToken()
        .assertGetOneByQuery(EndpointReusableQueries.getByResourceId(token01.resourceId))
    )
  );
  expect(agentTokenExtractor(updatedToken)).toMatchObject(result.token);
  expect(updatedToken.name).toBe(tokenUpdateInput.name);
  expect(updatedToken.description).toBe(tokenUpdateInput.description);
});
