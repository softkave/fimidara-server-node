import {AppResourceType, SessionAgentType} from '../../../definitions/system';
import {withAssignedPermissionGroupsAndTags} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/BaseContext';
import EndpointReusableQueries from '../../queries';
import {
  assertContext,
  getTestBaseContext,
  insertClientAssignedTokenForTest,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../test-utils/test-utils';
import {getPublicClientToken} from '../utils';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('client assigned token added', async () => {
  assertContext(context);
  const {userToken, user} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
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

  const {token} = await insertClientAssignedTokenForTest(
    context,
    userToken,
    workspace.resourceId,
    {
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
    }
  );

  const savedToken = getPublicClientToken(
    context,
    await withAssignedPermissionGroupsAndTags(
      context,
      workspace.resourceId,
      await context.data.clientAssignedToken.assertGetItem(
        EndpointReusableQueries.getById(token.resourceId)
      ),
      AppResourceType.ClientAssignedToken
    )
  );

  expect(savedToken).toMatchObject(token);
  expect(token.permissionGroups).toHaveLength(2);
  expect(token.permissionGroups[0]).toMatchObject({
    permissionGroupId: permissionGroup01.resourceId,
    assignedBy: {agentId: user.resourceId, agentType: SessionAgentType.User},
    order: 1,
  });

  expect(token.permissionGroups[1]).toMatchObject({
    permissionGroupId: permissionGroup02.resourceId,
    assignedBy: {agentId: user.resourceId, agentType: SessionAgentType.User},
    order: 2,
  });
});
