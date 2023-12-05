import {SessionAgent} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {resolveTargetChildrenAccessCheckWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {FileBackendMountQuery} from '../../contexts/data/types';
import {getWorkspaceResourceListQuery01} from '../../utils';
import {GetFileBackendConfigsEndpointParamsBase} from './types';

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

  const query: FileBackendMountQuery = getWorkspaceResourceListQuery01(workspace, report);

  if (other.backend) {
    query.backend = other.backend;
  }

  return query;
}
