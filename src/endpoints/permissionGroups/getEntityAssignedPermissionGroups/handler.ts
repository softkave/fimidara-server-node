import assert from 'assert';
import {validate} from '../../../utils/validate';
import {applyDefaultEndpointPaginationOptions, getWorkspaceFromEndpointInput} from '../../utils';
import {GetEntityAssignedPermissionGroupsEndpoint} from './types';
import {getEntityAssignedPermissionGroupsJoiSchema} from './validation';

const getEntityAssignedPermissionGroups: GetEntityAssignedPermissionGroupsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getEntityAssignedPermissionGroupsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  applyDefaultEndpointPaginationOptions(data);
  assert.fail('Not implemented yet');
  // return {page: getEndpointPageFromInput(data), permissionGroups: permissionGroupListExtractor([])};
};

export default getEntityAssignedPermissionGroups;
