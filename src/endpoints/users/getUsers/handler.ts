import {resolveTargetChildrenAccessCheckWithAgent} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {SessionAgent} from '../../../definitions/system.js';
import {validate} from '../../../utils/validate.js';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination.js';
import {getWorkspaceResourceByIdList} from '../../utils.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {userListExtractor} from '../utils.js';
import {GetUsersEndpoint} from './types.js';
import {getUsersJoiSchema} from './validation.js';

export async function getUsersQuery(agent: SessionAgent, workspaceId: string) {
  const report = await resolveTargetChildrenAccessCheckWithAgent({
    agent,
    workspaceId,
    target: {
      action: kFimidaraPermissionActions.readUser,
      targetId: workspaceId,
    },
  });

  return getWorkspaceResourceByIdList(workspaceId, report);
}

const getUsersEndpoint: GetUsersEndpoint = async reqData => {
  const data = validate(reqData.data, getUsersJoiSchema);
  const {agent, workspaceId} = await initEndpoint(reqData);

  const q = await getUsersQuery(agent, workspaceId);
  applyDefaultEndpointPaginationOptions(data);
  const users = await kSemanticModels
    .user()
    .getManyByWorkspaceAndIdList(q, data);

  return {
    page: getEndpointPageFromInput(data),
    users: userListExtractor(users),
  };
};

export default getUsersEndpoint;
