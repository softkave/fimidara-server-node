import {faker} from '@faker-js/faker';
import assert from 'assert';
import {merge} from 'lodash-es';
import {loopAndCollateAsync} from 'softkave-js-utils';
import {PartialDeep} from 'type-fest';
import {FimidaraEndpoints} from '../../publicEndpoints.js';
import {
  AddPermissionGroupEndpointParams,
  DeletePermissionGroupEndpointParams,
  GetPermissionGroupEndpointParams,
  GetWorkspacePermissionGroupsEndpointParams,
  UpdatePermissionGroupEndpointParams,
} from '../../publicTypes.js';
import {ITestVars} from '../utils.js';

export async function addPermissionGroupTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<AddPermissionGroupEndpointParams> = {}
) {
  const genInput: AddPermissionGroupEndpointParams = {
    permissionGroup: {
      name: faker.lorem.words(),
      description: faker.lorem.sentence(),
    },
  };
  const input: AddPermissionGroupEndpointParams = merge(genInput, props);
  const result = await endpoint.permissionGroups.addPermissionGroup({
    body: input,
  });
  return result;
}

export async function setupWorkspacePermissionGroupsTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  count = 2
) {
  const permissionGroups = await loopAndCollateAsync(
    () => addPermissionGroupTestExecFn(endpoint, vars),
    count,
    /** settlement */ 'all'
  );
  return {permissionGroups};
}

export async function getWorkspacePermissionGroupsTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: GetWorkspacePermissionGroupsEndpointParams
) {
  const result = await endpoint.permissionGroups.getWorkspacePermissionGroups({
    body: props,
  });
  return result;
}

export async function getPermissionGroupTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<GetPermissionGroupEndpointParams> = {}
) {
  let permissionGroupId = props.permissionGroupId;
  if (!permissionGroupId) {
    const permissionGroup = await addPermissionGroupTestExecFn(endpoint, vars);
    permissionGroupId = permissionGroup.body.permissionGroup.resourceId;
  }
  assert.ok(permissionGroupId);
  const input: GetPermissionGroupEndpointParams = {
    permissionGroupId: permissionGroupId,
  };
  const result = await endpoint.permissionGroups.getPermissionGroup({
    body: input,
  });
  assert(result.body.permissionGroup.resourceId === permissionGroupId);
  return result;
}

export async function deletePermissionGroupTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<DeletePermissionGroupEndpointParams> = {}
) {
  let permissionGroupId = props.permissionGroupId;
  if (!permissionGroupId) {
    const permissionGroup = await addPermissionGroupTestExecFn(endpoint, vars);
    permissionGroupId = permissionGroup.body.permissionGroup.resourceId;
  }
  assert.ok(permissionGroupId);
  const input: DeletePermissionGroupEndpointParams = {
    permissionGroupId: permissionGroupId,
  };
  const result = await endpoint.permissionGroups.deletePermissionGroup({
    body: input,
  });
}

export async function updatePermissionGroupTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<UpdatePermissionGroupEndpointParams> = {}
) {
  let permissionGroupId = props.permissionGroupId;

  if (!permissionGroupId) {
    const permissionGroup = await addPermissionGroupTestExecFn(endpoint, vars);
    permissionGroupId = permissionGroup.body.permissionGroup.resourceId;
  }

  assert.ok(permissionGroupId);
  const input: UpdatePermissionGroupEndpointParams = {
    permissionGroupId: permissionGroupId,
    data: {description: faker.lorem.words()},
  };
  const result = await endpoint.permissionGroups.updatePermissionGroup({
    body: input,
  });
  return result;
}
