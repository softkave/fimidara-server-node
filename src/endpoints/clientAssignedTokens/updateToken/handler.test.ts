import {AppResourceType, SessionAgentType} from '../../../definitions/system';
import {populateAssignedPermissionGroupsAndTags} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertClientAssignedTokenForTest,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import {clientAssignedTokenExtractor, getPublicClientToken} from '../utils';
import updateClientAssignedToken from './handler';
import {IUpdateClientAssignedTokenEndpointParams} from './types';

/**
 * TODO:
 * - [Low] Test that hanlder fails if permissionGroup doesn't exist
 * - Test updating other fields
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

test('client assigned token permission groups updated', async () => {
  assertContext(context);
  const {userToken, user} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {token: token01} = await insertClientAssignedTokenForTest(context, userToken, workspace.resourceId);
  const {permissionGroup: permissionGroup01} = await insertPermissionGroupForTest(
    context,
    userToken,
    workspace.resourceId
  );
  const {permissionGroup: permissionGroup02} = await insertPermissionGroupForTest(
    context,
    userToken,
    workspace.resourceId
  );

  const instData = RequestData.fromExpressRequest<IUpdateClientAssignedTokenEndpointParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      tokenId: token01.resourceId,
      token: {
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
      },
    }
  );

  const result = await updateClientAssignedToken(context, instData);
  assertEndpointResultOk(result);
  const updatedToken = getPublicClientToken(
    context,
    await populateAssignedPermissionGroupsAndTags(
      context,
      workspace.resourceId,
      await context.data.clientAssignedToken.assertGetOneByQuery(
        EndpointReusableQueries.getByResourceId(token01.resourceId)
      ),
      AppResourceType.ClientAssignedToken
    )
  );

  expect(clientAssignedTokenExtractor(updatedToken)).toMatchObject(result.token);
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
