import {AppActionType, AppResourceType, SessionAgent} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {checkAuthorization} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {SemanticDataAccessProviderRunOptions} from '../../contexts/semantic/types';
import {BaseContextType} from '../../contexts/types';
import {GetEntityPermissionItemsEndpointParams} from './types';

export async function getEntityPermissionItemsQuery(
  context: BaseContextType,
  agent: SessionAgent,
  workspace: Workspace,
  data: Pick<GetEntityPermissionItemsEndpointParams, 'entityId'>,
  opts?: SemanticDataAccessProviderRunOptions
) {
  if (agent.agentId !== data.entityId) {
    await checkAuthorization({
      context,
      agent,
      workspace,
      opts,
      workspaceId: workspace.resourceId,
      action: AppActionType.Read,
      targets: {targetType: AppResourceType.PermissionItem},
    });
  }
}
