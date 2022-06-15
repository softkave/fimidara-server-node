import {AppResourceType, SessionAgentType} from '../../../definitions/system';
import {withAssignedPermissionGroupsAndTags} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/BaseContext';
import {
  assertContext,
  getTestBaseContext,
  insertPermissionGroupForTest,
  insertProgramAccessTokenForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../test-utils/test-utils';
import ProgramAccessTokenQueries from '../queries';
import {getPublicProgramToken, programAccessTokenExtractor} from '../utils';

/**
 * TODO:
 * [Low] - Test that hanlder fails if token exists
 * [Low] - Test that hanlder fails if permissionGroups don't exist
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('program access token added', async () => {
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

  const {token} = await insertProgramAccessTokenForTest(
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

  const savedToken = getPublicProgramToken(
    context,
    await withAssignedPermissionGroupsAndTags(
      context,
      workspace.resourceId,
      await context.data.programAccessToken.assertGetItem(
        ProgramAccessTokenQueries.getById(token.resourceId)
      ),
      AppResourceType.ProgramAccessToken
    )
  );

  expect(programAccessTokenExtractor(savedToken)).toMatchObject(token);
  expect(token.permissionGroups.length).toEqual(2);
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
