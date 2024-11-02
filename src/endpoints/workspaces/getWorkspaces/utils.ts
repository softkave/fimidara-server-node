import {compact} from 'lodash-es';
import {resolveTargetChildrenAccessCheckWithAgent} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {SemanticWorkspaceGetByWorkspaceAndIdListQuery} from '../../../contexts/semantic/types.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {SessionAgent} from '../../../definitions/system.js';
import {getWorkspaceResourceByIdList} from '../../utils.js';

export async function getWorkspaceListQuery(
  agent: SessionAgent,
  workspaceId?: string
): Promise<SemanticWorkspaceGetByWorkspaceAndIdListQuery> {
  if (workspaceId) {
    const report = await resolveTargetChildrenAccessCheckWithAgent({
      agent,
      workspaceId,
      target: {
        action: kFimidaraPermissionActions.readWorkspace,
        targetId: workspaceId,
      },
    });

    return getWorkspaceResourceByIdList(workspaceId, report);
  } else {
    // TODO: paginate query (maybe iterate over queries with a continuation
    // token or something)
    const pItems = await kSemanticModels.permissions().getPermissionItems({
      entityId: agent.agentId,
      action: kFimidaraPermissionActions.readWorkspace,
      sortByDate: true,
    });
    const accessFilteredPItems = pItems.filter(pItem => pItem.access);

    return {
      workspaceId: undefined,
      resourceIdList: compact(
        accessFilteredPItems.map(pItem => pItem.workspaceId)
      ),
    };
  }
}
