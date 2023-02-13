import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {
  checkAuthorization,
  makeWorkspacePermissionContainerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {getWorkspaceId} from '../../contexts/SessionContext';
import {getEndpointPageFromInput} from '../../utils';
import {checkWorkspaceExists} from '../../workspaces/utils';
import checkEntitiesExist from '../checkEntitiesExist';
import PermissionItemQueries from '../queries';
import {PermissionItemUtils} from '../utils';
import {GetEntityPermissionItemsEndpoint} from './types';
import {getEntityPermissionItemsJoiSchema} from './validation';

const getEntityPermissionItems: GetEntityPermissionItemsEndpoint = async (context, instData) => {
  const data = validate(instData.data, getEntityPermissionItemsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceId(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(context, workspaceId);
  await checkEntitiesExist(context, agent, workspace, [data]);
  await checkAuthorization({
    context,
    agent,
    workspace,
    action: BasicCRUDActions.Read,
    type: AppResourceType.PermissionItem,
    permissionContainers: makeWorkspacePermissionContainerList(workspace.resourceId),
  });

  const items = await context.data.permissionItem.getManyByQuery(
    PermissionItemQueries.getByPermissionEntity(data.permissionEntityId, data.permissionEntityType),
    data
  );
  return {page: getEndpointPageFromInput(data), items: PermissionItemUtils.extractPublicPermissionItemList(items)};
};

export default getEntityPermissionItems;
