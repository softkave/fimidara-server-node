import {AppResourceType, BasicCRUDActions, ISessionAgent} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {checkAuthorization} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {IBaseContext} from '../../contexts/types';
import PermissionItemQueries from '../queries';
import {IGetEntityPermissionItemsEndpointParams} from './types';

export async function getEntityPermissionItemsQuery(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  data: Pick<IGetEntityPermissionItemsEndpointParams, 'entityId'>
) {
  await checkAuthorization({
    context,
    agent,
    workspaceId: workspace.resourceId,
    action: BasicCRUDActions.Read,
    targets: {type: AppResourceType.PermissionItem},
  });
  return PermissionItemQueries.getByPermissionEntity(data.entityId);
}
