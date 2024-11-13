import {assert, expect} from 'vitest';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {AppRuntimeState} from '../../../definitions/system.js';

export async function checkPublicPermissionGroup(runtimeVars: AppRuntimeState) {
  const {publicPermissionGroupName} = kUtilsInjectables.suppliedConfig();
  assert.ok(publicPermissionGroupName, 'publicPermissionGroupName is required');

  const permissionGroup = await kSemanticModels
    .permissionGroup()
    .getOneById(runtimeVars.publicPermissionGroupId);

  expect(permissionGroup).toBeDefined();
  expect(permissionGroup!.name).toBe(publicPermissionGroupName);
}

export async function checkPublicPermissions(runtimeVars: AppRuntimeState) {
  const {publicPermissions} = kUtilsInjectables.suppliedConfig();

  if (!publicPermissions || publicPermissions.length === 0) {
    return;
  }

  const permissionItems = await kSemanticModels
    .permissionItem()
    .getManyByEntityId(
      runtimeVars.rootWorkspaceId,
      runtimeVars.publicPermissionGroupId
    );
  const permissionItemActions = permissionItems.map(item => item.action);

  expect(permissionItemActions).toEqual(publicPermissions);
}
