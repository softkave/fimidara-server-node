import {AppResourceType, BasicCRUDActions, ISessionAgent} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {
  checkAuthorization,
  makeWorkspacePermissionContainerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../../contexts/types';
import PermissionItemQueries from '../queries';
import {IGetEntityPermissionItemsEndpointParams} from './types';

export async function getEntityPermissionItemsQuery(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  data: Pick<IGetEntityPermissionItemsEndpointParams, 'permissionEntityId' | 'permissionEntityType'>
) {
  await checkAuthorization({
    context,
    agent,
    workspace,
    action: BasicCRUDActions.Read,
    type: AppResourceType.PermissionItem,
    permissionContainers: makeWorkspacePermissionContainerList(workspace.resourceId),
  });
  return PermissionItemQueries.getByPermissionEntity(data.permissionEntityId);
}
