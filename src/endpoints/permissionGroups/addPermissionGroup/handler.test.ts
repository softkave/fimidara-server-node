import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {kSemanticModels} from '../../contexts/injection/injectables';
import EndpointReusableQueries from '../../queries';
import {completeTests} from '../../testUtils/helpers/test';
import {
  initTests,
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
  await initTests();
});

afterAll(async () => {
  await completeTests();
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
