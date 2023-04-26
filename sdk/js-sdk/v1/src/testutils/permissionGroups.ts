import {faker} from '@faker-js/faker';
import {merge} from 'lodash';
import {PartialDeep} from 'type-fest';
import {FimidaraEndpoints} from '../public-endpoints';
import {
  AddPermissionGroupEndpointParams,
  DeletePermissionGroupEndpointParams,
  GetPermissionGroupEndpointParams,
  GetWorkspacePermissionGroupsEndpointParams,
  UpdatePermissionGroupEndpointParams,
} from '../public-types';
import {ITestVars, loopAndCollate} from './utils';
import assert = require('assert');

export async function addPermissionGroupTest(
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

export async function setupWorkspacePermissionGroupsTest(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  count = 2
) {
  const permissionGroups = await Promise.all(
    loopAndCollate(count, () => addPermissionGroupTest(endpoint, vars))
  );
  return {permissionGroups};
}

export async function getWorkspacePermissionGroupsTest(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: GetWorkspacePermissionGroupsEndpointParams
) {
  const result = await endpoint.permissionGroups.getWorkspacePermissionGroups({
    body: props,
  });
  return result;
}

export async function getPermissionGroupTest(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<GetPermissionGroupEndpointParams> = {}
) {
  let permissionGroupId = props.permissionGroupId;
  if (!permissionGroupId) {
    const permissionGroup = await addPermissionGroupTest(endpoint, vars);
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

export async function deletePermissionGroupTest(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<DeletePermissionGroupEndpointParams> = {}
) {
  let permissionGroupId = props.permissionGroupId;
  if (!permissionGroupId) {
    const permissionGroup = await addPermissionGroupTest(endpoint, vars);
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

export async function updatePermissionGroupTest(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<UpdatePermissionGroupEndpointParams> = {}
) {
  let permissionGroupId = props.permissionGroupId;

  if (!permissionGroupId) {
    const permissionGroup = await addPermissionGroupTest(endpoint, vars);
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

export async function deleteManyPermissionGroups(
  endpoint: FimidaraEndpoints,
  ids: string[]
) {
  await Promise.allSettled(
    ids.map(id =>
      endpoint.permissionGroups.deletePermissionGroup({
        body: {permissionGroupId: id},
      })
    )
  );
}
