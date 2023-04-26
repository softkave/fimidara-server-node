import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {BaseContextType} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  initTestBaseContext,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../testUtils/testUtils';
import {permissionGroupExtractor} from '../utils';

/**
 * TODO:
 * [Low] - Test that hanlder fails if permissionGroup exists
 */

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('addPermissionGroup', () => {
  test('permissionGroup permissions group added', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {permissionGroup: permissionGroup} = await insertPermissionGroupForTest(
      context,
      userToken,
      workspace.resourceId
    );
    const savedPermissionGroup = await populateAssignedTags(
      context,
      workspace.resourceId,
      await context.semantic.permissionGroup.assertGetOneByQuery(
        EndpointReusableQueries.getByResourceId(permissionGroup.resourceId)
      )
    );
    expect(permissionGroupExtractor(savedPermissionGroup)).toMatchObject(permissionGroup);
  });
});
