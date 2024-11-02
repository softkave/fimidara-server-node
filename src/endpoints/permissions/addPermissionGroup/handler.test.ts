import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems.js';
import EndpointReusableQueries from '../../queries.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  initTests,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../testUtils/testUtils.js';
import {permissionGroupExtractor} from '../utils.js';

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
    const {permissionGroup: permissionGroup} =
      await insertPermissionGroupForTest(userToken, workspace.resourceId);
    const savedPermissionGroup = await populateAssignedTags(
      workspace.resourceId,
      await kSemanticModels
        .permissionGroup()
        .assertGetOneByQuery(
          EndpointReusableQueries.getByResourceId(permissionGroup.resourceId)
        )
    );
    expect(permissionGroupExtractor(savedPermissionGroup)).toMatchObject(
      permissionGroup
    );
  });
});
