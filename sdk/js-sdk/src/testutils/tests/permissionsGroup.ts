import {expect} from 'vitest';
import {FimidaraEndpoints} from '../../publicEndpoints.js';
import {
  addPermissionGroupTestExecFn,
  deletePermissionGroupTestExecFn,
  getPermissionGroupTestExecFn,
  setupWorkspacePermissionGroupsTestExecFn,
  getWorkspacePermissionGroupsTestExecFn,
  updatePermissionGroupTestExecFn,
} from '../execFns/permissionGroups.js';
import {
  ITestVars,
  getTestVars,
  containsNoneIn,
  indexByResourceId,
} from '../utils.js';

const vars: ITestVars = getTestVars();
const fimidara = new FimidaraEndpoints({
  authToken: vars.authToken,
  serverURL: vars.serverURL,
});

export const test_addPermissionGroup = async () => {
  await addPermissionGroupTestExecFn(fimidara, vars);
};

export const test_deletePermissionGroup = async () => {
  await deletePermissionGroupTestExecFn(fimidara, vars);
};

export const test_getPermissionGroup = async () => {
  await getPermissionGroupTestExecFn(fimidara, vars);
};

export const test_getWorkspacePermissionGroups = async () => {
  const count = 15;
  const pageSize = 10;
  await setupWorkspacePermissionGroupsTestExecFn(fimidara, vars, count);
  const [result00, result01] = await Promise.all([
    getWorkspacePermissionGroupsTestExecFn(fimidara, vars, {
      pageSize,
      page: 0,
    }),
    getWorkspacePermissionGroupsTestExecFn(fimidara, vars, {
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
};

export const test_updatePermissionGroup = async () => {
  await updatePermissionGroupTestExecFn(fimidara, vars);
};
