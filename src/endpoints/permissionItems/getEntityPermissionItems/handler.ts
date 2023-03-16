import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
  getWorkspaceFromEndpointInput,
} from '../../utils';
import {checkPermissionEntitiesExist} from '../checkPermissionArtifacts';
import {PermissionItemUtils} from '../utils';
import {GetEntityPermissionItemsEndpoint} from './types';
import {getEntityPermissionItemsQuery} from './utils';
import {getEntityPermissionItemsJoiSchema} from './validation';

/**
 * TODO: Support returning a list of permissions an agent/entity can perform
 * TODO: Support returning all permission items belonging to an entity directly
 * or inherited
 */
const getEntityPermissionItems: GetEntityPermissionItemsEndpoint = async (context, instData) => {
  const data = validate(instData.data, getEntityPermissionItemsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  await checkPermissionEntitiesExist(
    context,
    agent,
    workspace.resourceId,
    [data.entityId],
    BasicCRUDActions.Read
  );
  await getEntityPermissionItemsQuery(context, agent, workspace, data);
  applyDefaultEndpointPaginationOptions(data);
  const items = await context.semantic.permissionItem.getManyByLiteralDataQuery(
    {entityId: data.entityId},
    data
  );
  return {
    page: getEndpointPageFromInput(data),
    items: PermissionItemUtils.extractPublicPermissionItemList(items),
  };
};

export default getEntityPermissionItems;
