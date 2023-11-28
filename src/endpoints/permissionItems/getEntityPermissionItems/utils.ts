import {SessionAgent} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {SemanticProviderRunOptions} from '../../contexts/semantic/types';
import {BaseContextType} from '../../contexts/types';
import {checkPermissionEntitiesExist} from '../checkPermissionArtifacts';
import {GetEntityPermissionItemsEndpointParams} from './types';

export async function doAccessCheckForGetEntityPermissionItems(
  context: BaseContextType,
  agent: SessionAgent,
  workspace: Workspace,
  data: Pick<GetEntityPermissionItemsEndpointParams, 'entityId'>,
  opts?: SemanticProviderRunOptions
) {
  if (agent.agentId !== data.entityId) {
    await Promise.all([
      checkPermissionEntitiesExist(
        context,
        agent,
        workspace.resourceId,
        [data.entityId],
        'updatePermission'
      ),
      checkAuthorizationWithAgent({
        context,
        agent,
        workspace,
        opts,
        workspaceId: workspace.resourceId,
        target: {targetId: workspace.resourceId, action: 'updatePermission'},
      }),
    ]);
  }
}
