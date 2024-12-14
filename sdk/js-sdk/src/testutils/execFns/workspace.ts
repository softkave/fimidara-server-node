import {faker} from '@faker-js/faker';
import assert from 'assert';
import {merge} from 'lodash-es';
import {PartialDeep} from 'type-fest';
import {FimidaraEndpoints} from '../../endpoints/publicEndpoints.js';
import {
  GetWorkspaceEndpointParams,
  UpdateWorkspaceEndpointParams,
} from '../../endpoints/publicTypes.js';
import {ITestVars} from '../utils.common.js';

export async function getWorkspaceTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<GetWorkspaceEndpointParams> = {}
) {
  const genInput: GetWorkspaceEndpointParams = {
    workspaceId: vars.workspaceId,
  };
  const input: GetWorkspaceEndpointParams = merge(genInput, props);
  const result = await endpoint.workspaces.getWorkspace(input);
  assert(result.workspace.resourceId === vars.workspaceId);
  return result;
}

export async function updateWorkspaceTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<UpdateWorkspaceEndpointParams> = {}
) {
  const defaultCompanyName = faker.company.name();
  const genInput: UpdateWorkspaceEndpointParams = {
    workspaceId: vars.workspaceId,
    workspace: {
      name: defaultCompanyName,
      // rootname: makeRootnameFromName(defaultCompanyName),
    },
  };
  const input: UpdateWorkspaceEndpointParams = merge(genInput, props);
  const result = await endpoint.workspaces.updateWorkspace(input);
  assert(result.workspace.name === input.workspace.name);
  return result;
}
