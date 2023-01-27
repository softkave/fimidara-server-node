import {AppResourceType, SessionAgentType} from '../../../definitions/system';
import {populateAssignedPermissionGroupsAndTags} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
import {cleanupContext} from '../../test-utils/context/cleanup';
import {
  assertContext,
  initTestBaseContext,
  insertClientAssignedTokenForTest,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../test-utils/test-utils';
import {getPublicClientToken} from '../utils';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await cleanupContext(context);
});

test('client assigned token added', async () => {
  assertContext(context);
  const {userToken, user} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
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

  const {token} = await insertClientAssignedTokenForTest(context, userToken, workspace.resourceId, {
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
  });

  const savedToken = getPublicClientToken(
    context,
    await populateAssignedPermissionGroupsAndTags(
      context,
      workspace.resourceId,
      await context.data.clientAssignedToken.assertGetOneByQuery(EndpointReusableQueries.getById(token.resourceId)),
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
