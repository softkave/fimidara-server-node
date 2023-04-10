import {validate} from '../../../utils/validate';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {getWorkspacePermissionGroupsQuery} from '../getWorkspacePermissionGroups/utils';
import {CountWorkspacePermissionGroupsEndpoint} from './types';
import {countWorkspacePermissionGroupsJoiSchema} from './validation';

const countWorkspacePermissionGroups: CountWorkspacePermissionGroupsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, countWorkspacePermissionGroupsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  const q = await getWorkspacePermissionGroupsQuery(context, agent, workspace);
  const count = await context.semantic.permissionGroup.countManyByWorkspaceAndIdList(q);
  return {count};
};

export default countWorkspacePermissionGroups;
