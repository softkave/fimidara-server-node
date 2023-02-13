import {AppResourceType} from '../../../definitions/system';
import {populateAssignedPermissionGroupsAndTags} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
import {
  assertContext,
  initTestBaseContext,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../test-utils/test-utils';
import {permissionGroupExtractor} from '../utils';

/**
 * TODO:
 * [Low] - Test that hanlder fails if permissionGroup exists
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

test('permissionGroup permissions group added', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {permissionGroup: permissionGroup} = await insertPermissionGroupForTest(
    context,
    userToken,
    workspace.resourceId
  );

  const savedPermissionGroup = await populateAssignedPermissionGroupsAndTags(
    context,
    workspace.resourceId,
    await context.data.permissiongroup.assertGetOneByQuery(
      EndpointReusableQueries.getByResourceId(permissionGroup.resourceId)
    ),
    AppResourceType.PermissionGroup
  );

  expect(permissionGroupExtractor(savedPermissionGroup)).toMatchObject(permissionGroup);
});
