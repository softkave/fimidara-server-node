import {faker} from '@faker-js/faker';
import RequestData from '../../RequestData';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
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
import {agentTokenExtractor, getPublicAgentToken} from '../utils';
import updateAgentToken from './handler';
import {IUpdateAgentTokenEndpointParams, IUpdateAgentTokenInput} from './types';

/**
 * TODO:
 * - [Low] Test that hanlder fails if permissionGroups doesn't exist
 * - [Low] Test that onReferenced feature works
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

test('program access token updated', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {token: token01} = await insertAgentTokenForTest(context, userToken, workspace.resourceId);
  const tokenUpdateInput: IUpdateAgentTokenInput = {
    name: faker.lorem.words(10),
    description: faker.lorem.words(10),
  };

  const instData = RequestData.fromExpressRequest<IUpdateAgentTokenEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {tokenId: token01.resourceId, token: tokenUpdateInput, workspaceId: workspace.resourceId}
  );
  const result = await updateAgentToken(context, instData);
  assertEndpointResultOk(result);

  const updatedToken = getPublicAgentToken(
    context,
    await populateAssignedTags(
      context,
      workspace.resourceId,
      await context.semantic.agentToken.assertGetOneByQuery(
        EndpointReusableQueries.getByResourceId(token01.resourceId)
      )
    )
  );
  expect(agentTokenExtractor(updatedToken)).toMatchObject(result.token);
  expect(updatedToken.name).toBe(tokenUpdateInput.name);
  expect(updatedToken.description).toBe(tokenUpdateInput.description);
});
