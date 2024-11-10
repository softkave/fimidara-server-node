import {resolveTargetChildrenAccessCheckWithAgent} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {FileBackendConfigQuery} from '../../../contexts/data/types.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {SessionAgent} from '../../../definitions/system.js';
import {getWorkspaceResourceByIdListQuery} from '../../utils.js';
import {GetFileBackendConfigsEndpointParamsBase} from './types.js';

export async function getFileBackendConfigsQuery(
  agent: SessionAgent,
  workspaceId: string,
  other: Pick<GetFileBackendConfigsEndpointParamsBase, 'backend'>
) {
  const report = await resolveTargetChildrenAccessCheckWithAgent({
    agent,
    workspaceId,
    target: {
      action: kFimidaraPermissionActions.readFileBackendConfig,
      targetId: workspaceId,
    },
  });

  const query: FileBackendConfigQuery = getWorkspaceResourceByIdListQuery(
    workspaceId,
    report
  );

  if (other.backend) {
    query.backend = other.backend;
  }

  return query;
}
