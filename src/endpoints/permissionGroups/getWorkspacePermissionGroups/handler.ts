import {validate} from '../../../utils/validate';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../utils';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {permissionGroupListExtractor} from '../utils';
import {GetWorkspacePermissionGroupsEndpoint} from './types';
import {getWorkspacePermissionGroupsQuery} from './utils';
import {getWorkspacePermissionGroupsJoiSchema} from './validation';

const getWorkspacePermissionGroups: GetWorkspacePermissionGroupsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getWorkspacePermissionGroupsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  const q = await getWorkspacePermissionGroupsQuery(context, agent, workspace);
  applyDefaultEndpointPaginationOptions(data);
  const items = await context.semantic.permissionGroup.getManyByWorkspaceAndIdList(
    q,
    data
  );
  return {
    page: getEndpointPageFromInput(data),
    permissionGroups: permissionGroupListExtractor(items),
  };
};

export default getWorkspacePermissionGroups;
