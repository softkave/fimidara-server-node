import {AppActionType, AppResourceType, ISessionAgent} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {checkAuthorization} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {IBaseContext} from '../../contexts/types';
import {IGetEntityPermissionItemsEndpointParams} from './types';

export async function getEntityPermissionItemsQuery(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  data: Pick<IGetEntityPermissionItemsEndpointParams, 'entityId'>
) {
  if (agent.agentId !== data.entityId) {
    await checkAuthorization({
      context,
      agent,
      workspaceId: workspace.resourceId,
      action: AppActionType.Read,
      targets: {targetType: AppResourceType.PermissionItem},
    });
  }
}
