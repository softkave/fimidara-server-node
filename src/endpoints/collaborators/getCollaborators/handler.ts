import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {UserWithWorkspace} from '../../../definitions/user.js';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {populateUserListWithWorkspaces} from '../../assignedItems/getAssignedItems.js';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination.js';
import {checkWorkspaceExists} from '../../workspaces/utils.js';
import {collaboratorListExtractor} from '../utils.js';
import {GetCollaboratorsEndpoint} from './types.js';
import {getCollaboratorsQuery} from './utils.js';
import {getCollaboratorsJoiSchema} from './validation.js';

const getCollaborators: GetCollaboratorsEndpoint = async reqData => {
  const data = validate(reqData.data, getCollaboratorsJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentType.api,
      kSessionUtils.accessScope.api
    );
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(workspaceId);
  const assignedItemsQuery = await getCollaboratorsQuery(agent, workspace);
  applyDefaultEndpointPaginationOptions(data);
  const assignedItems = await kSemanticModels
    .assignedItem()
    .getManyByQuery(assignedItemsQuery, data);
  let usersWithWorkspaces: UserWithWorkspace[] = [];
  if (assignedItems.length > 0) {
    const userIdList = assignedItems.map(item => item.assigneeId);
    const users = await kSemanticModels.user().getManyByIdList(userIdList);

    // TODO: only populate the calling workspace
    usersWithWorkspaces = await populateUserListWithWorkspaces(users);
  }

  return {
    page: getEndpointPageFromInput(data),
    collaborators: collaboratorListExtractor(
      usersWithWorkspaces,
      workspace.resourceId
    ),
  };
};

export default getCollaborators;
