import {resolveTargetChildrenAccessCheckWithAgent} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {FileBackendConfigQuery} from '../../../contexts/data/types.js';
import {SessionAgent} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';
import {getWorkspaceResourceListQuery01} from '../../utils.js';
import {GetFileBackendConfigsEndpointParamsBase} from './types.js';

export async function getFileBackendConfigsQuery(
  agent: SessionAgent,
  workspace: Workspace,
  other: Pick<GetFileBackendConfigsEndpointParamsBase, 'backend'>
) {
  const report = await resolveTargetChildrenAccessCheckWithAgent({
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {action: 'readFileBackendConfig', targetId: workspace.resourceId},
  });

  const query: FileBackendConfigQuery = getWorkspaceResourceListQuery01(
    workspace,
    report
  );

  if (other.backend) {
    query.backend = other.backend;
  }

  return query;
}
