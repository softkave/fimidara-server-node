import {validate} from '../../../utils/validate';
import {getWorkspaceFromEndpointInput} from '../../utils';
import checkEntitiesExist from '../checkEntitiesExist';
import {getEntityPermissionItemsQuery} from '../getEntityPermissionItems/utils';
import {CountEntityPermissionItemsEndpoint} from './types';
import {countEntityPermissionItemsJoiSchema} from './validation';

const countEntityPermissionItems: CountEntityPermissionItemsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, countEntityPermissionItemsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  await checkEntitiesExist(context, agent, workspace, [data]);
  const q = await getEntityPermissionItemsQuery(context, agent, workspace, data);
  const count = await context.data.permissionItem.countByQuery(q);
  return {count};
};

export default countEntityPermissionItems;
