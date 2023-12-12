import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import EndpointReusableQueries from '../../queries';
import {completeTest} from '../../testUtils/helpers/test';
import {
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../testUtils/testUtils';
import {permissionGroupExtractor} from '../utils';

/**
 * TODO:
 * [Low] - Test that hanlder fails if permissionGroup exists
 */

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest();
});

describe('addPermissionGroup', () => {
  test('permissionGroup permissions group added', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {permissionGroup: permissionGroup} = await insertPermissionGroupForTest(
      userToken,
      workspace.resourceId
    );
    const savedPermissionGroup = await populateAssignedTags(
      workspace.resourceId,
      await kSemanticModels
        .permissionGroup()
        .assertGetOneByQuery(
          EndpointReusableQueries.getByResourceId(permissionGroup.resourceId)
        )
    );
    expect(permissionGroupExtractor(savedPermissionGroup)).toMatchObject(permissionGroup);
  });
});
