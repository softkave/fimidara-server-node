import {FimidaraEndpoints} from '..';
import {
  addPermissionGroupTest,
  deletePermissionGroupTest,
  getPermissionGroupTest,
  getWorkspacePermissionGroupsTest,
  setupWorkspacePermissionGroupsTest,
  updatePermissionGroupTest,
} from '../testutils/permissionGroups';
import {
  ITestVars,
  containsNoneIn,
  getTestVars,
  indexByResourceId,
} from '../testutils/utils';

const vars: ITestVars = getTestVars();
const fimidara = new FimidaraEndpoints({authToken: vars.authToken});

describe('permission group', () => {
  test('update permission group', async () => {
    await updatePermissionGroupTest(fimidara, vars);
  });

  test('delete permission group', async () => {
    await deletePermissionGroupTest(fimidara, vars);
  });

  test('get permission group', async () => {
    await getPermissionGroupTest(fimidara, vars);
  });

  test('get workspace tokens paginated', async () => {
    const count = 15;
    const pageSize = 10;
    await setupWorkspacePermissionGroupsTest(fimidara, vars, count);
    const [result00, result01] = await Promise.all([
      getWorkspacePermissionGroupsTest(fimidara, vars, {
        pageSize,
        page: 0,
      }),
      getWorkspacePermissionGroupsTest(fimidara, vars, {
        pageSize,
        page: 1,
      }),
    ]);
    expect(result00.body.page).toBe(0);
    expect(result01.body.page).toBe(1);
    containsNoneIn(
      result00.body.permissionGroups,
      result01.body.permissionGroups,
      indexByResourceId
    );
  });

  test('add permission group', async () => {
    await addPermissionGroupTest(fimidara, vars);
  });
});
