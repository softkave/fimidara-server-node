import {validate} from '../../../utils/validate';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
  getWorkspaceFromEndpointInput,
} from '../../utils';
import {PermissionItemUtils} from '../utils';
import {GetResourcePermissionItemsEndpoint} from './types';
import {getResourcePermissionItemsQuery} from './utils';
import {getResourcePermissionItemsJoiSchema} from './validation';

/**
 * TODO: Support fetching permission items that touch target type without target
 * ID TODO: Support fetching permission items that are specific to the query not
 * just all permissions that touch it
 * TODO: Look into adding endpoint for fetching permission items for a containers
 */
const getResourcePermissionItems: GetResourcePermissionItemsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getResourcePermissionItemsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  const q = await getResourcePermissionItemsQuery(context, agent, workspace, data);
  applyDefaultEndpointPaginationOptions(data);
  const permissionItems = await context.semantic.permissionItem.getManyByLiteralDataQuery(q, data);
  return {
    page: getEndpointPageFromInput(data),
    items: PermissionItemUtils.extractPublicPermissionItemList(permissionItems),
  };
};

export default getResourcePermissionItems;
