import {faker} from '@faker-js/faker';
import assert from 'assert';
import {merge} from 'lodash-es';
import {PartialDeep} from 'type-fest';
import {FimidaraEndpoints} from '../../publicEndpoints.js';
import {
  GetWorkspaceEndpointParams,
  UpdateWorkspaceEndpointParams,
} from '../../publicTypes.js';
import {ITestVars} from '../utils.js';

export async function getWorkspaceTestExecFn(
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
  const result = await endpoint.workspaces.updateWorkspace({body: input});
  assert(result.body.workspace.name === input.workspace.name);
  return result;
}
