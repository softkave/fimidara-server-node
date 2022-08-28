import {faker} from '@faker-js/faker';
import {AppResourceType, SessionAgentType} from '../../../definitions/system';
import {populateAssignedPermissionGroupsAndTags} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertPermissionGroupForTest,
  insertProgramAccessTokenForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import ClientAssignedTokenQueries from '../queries';
import {getPublicProgramToken, programAccessTokenExtractor} from '../utils';
import updateProgramAccessToken from './handler';
import {IUpdateProgramAccessTokenEndpointParams} from './types';

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
  await context?.dispose();
});

test('program access token updated', async () => {
  assertContext(context);
  const {userToken, user} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {token: token01} = await insertProgramAccessTokenForTest(
    context,
    userToken,
    workspace.resourceId
  );

  const {permissionGroup: permissionGroup01} =
    await insertPermissionGroupForTest(
      context,
      userToken,
      workspace.resourceId
    );

  const {permissionGroup: permissionGroup02} =
    await insertPermissionGroupForTest(
      context,
      userToken,
      workspace.resourceId
    );

  const tokenUpdateInput = {
    name: faker.lorem.words(3),
    description: faker.lorem.words(10),
    permissionGroups: [
      {
        permissionGroupId: permissionGroup01.resourceId,
        order: 1,
      },
      {
        permissionGroupId: permissionGroup02.resourceId,
        order: 2,
      },
    ],
  };

  const instData =
    RequestData.fromExpressRequest<IUpdateProgramAccessTokenEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        tokenId: token01.resourceId,
        token: tokenUpdateInput,
      }
    );

  const result = await updateProgramAccessToken(context, instData);
  assertEndpointResultOk(result);

  const updatedToken = getPublicProgramToken(
    context,
    await populateAssignedPermissionGroupsAndTags(
      context,
      workspace.resourceId,
      await context.data.programAccessToken.assertGetItem(
        ClientAssignedTokenQueries.getById(token01.resourceId)
      ),
      AppResourceType.ProgramAccessToken
    )
  );

  expect(programAccessTokenExtractor(updatedToken)).toMatchObject(result.token);
  expect(updatedToken.name).toBe(tokenUpdateInput.name);
  expect(updatedToken.description).toBe(tokenUpdateInput.description);
  expect(result.token.permissionGroups.length).toEqual(2);
  expect(result.token.permissionGroups[0]).toMatchObject({
    permissionGroupId: permissionGroup01.resourceId,
    assignedBy: {agentId: user.resourceId, agentType: SessionAgentType.User},
    order: 1,
  });

  expect(result.token.permissionGroups[1]).toMatchObject({
    permissionGroupId: permissionGroup02.resourceId,
    assignedBy: {agentId: user.resourceId, agentType: SessionAgentType.User},
    order: 2,
  });
});
