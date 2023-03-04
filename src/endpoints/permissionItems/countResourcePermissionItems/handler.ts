import {validate} from '../../../utils/validate';
import {getWorkspaceFromEndpointInput} from '../../utils';
import {getResourcePermissionItemsQuery} from '../getResourcePermissionItems/utils';
import {CountResourcePermissionItemsEndpoint} from './types';
import {countResourcePermissionItemsJoiSchema} from './validation';

const countResourcePermissionItems: CountResourcePermissionItemsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, countResourcePermissionItemsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  const {queries} = await getResourcePermissionItemsQuery(context, agent, workspace, data);
  const count = await context.semantic.permissionItem.countByQueryList(queries);
  return {count};
};

export default countResourcePermissionItems;
