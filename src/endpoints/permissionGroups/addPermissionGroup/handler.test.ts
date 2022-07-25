import {AppResourceType} from '../../../definitions/system';
import {populateAssignedPermissionGroupsAndTags} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/BaseContext';
import {
  assertContext,
  initTestBaseContext,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../test-utils/test-utils';
import PermissionGroupQueries from '../queries';
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
    await context.data.permissiongroup.assertGetItem(
      PermissionGroupQueries.getById(permissionGroup.resourceId)
    ),
    AppResourceType.PermissionGroup
  );

  expect(permissionGroupExtractor(savedPermissionGroup)).toMatchObject(
    permissionGroup
  );
});
