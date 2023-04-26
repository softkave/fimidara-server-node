import {faker} from '@faker-js/faker';
import {merge} from 'lodash';
import {PartialDeep} from 'type-fest';
import {FimidaraEndpoints} from '../public-endpoints';
import {
  GetWorkspaceEndpointParams,
  UpdateWorkspaceEndpointParams,
} from '../public-types';
import {ITestVars} from './utils';
import assert = require('assert');

export async function getWorkspaceTest(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<GetWorkspaceEndpointParams> = {}
) {
  const genInput: GetWorkspaceEndpointParams = {
    workspaceId: vars.workspaceId,
  };
  const input: GetWorkspaceEndpointParams = merge(genInput, props);
  const result = await endpoint.workspaces.getWorkspace({body: input});
  assert(result.body.workspace.resourceId === vars.workspaceId);
  return result;
}

export async function updateWorkspaceTest(
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
  const result = await endpoint.workspaces.updateWorkspace({body: input});
  assert(result.body.workspace.name === input.workspace.name);
  return result;
}
