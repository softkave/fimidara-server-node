import {describe, test} from "vitest";
import {
  test_addPermissionGroup,
  test_deletePermissionGroup,
  test_getPermissionGroup,
  test_getWorkspacePermissionGroups,
  test_updatePermissionGroup,
} from '../testutils/tests/permissionsGroup.js';

describe('permission group', () => {
  test('update permission group', async () => {
    await test_updatePermissionGroup();
  });

  test('delete permission group', async () => {
    await test_deletePermissionGroup();
  });

  test('get permission group', async () => {
    await test_getPermissionGroup();
  });

  test('get workspace permission groups paginated', async () => {
    await test_getWorkspacePermissionGroups();
  });

  test('add permission group', async () => {
    await test_addPermissionGroup();
  });
});
