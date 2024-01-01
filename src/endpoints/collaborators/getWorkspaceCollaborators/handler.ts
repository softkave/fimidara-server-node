import {UserWithWorkspace} from '../../../definitions/user';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {populateUserListWithWorkspaces} from '../../assignedItems/getAssignedItems';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination';
import {checkWorkspaceExists} from '../../workspaces/utils';
import {collaboratorListExtractor} from '../utils';
import {GetWorkspaceCollaboratorsEndpoint} from './types';
import {getWorkspaceCollaboratorsQuery} from './utils';
import {getWorkspaceCollaboratorsJoiSchema} from './validation';

const getWorkspaceCollaborators: GetWorkspaceCollaboratorsEndpoint = async instData => {
  const data = validate(instData.data, getWorkspaceCollaboratorsJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(workspaceId);
  const assignedItemsQuery = await getWorkspaceCollaboratorsQuery(agent, workspace);
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
    collaborators: collaboratorListExtractor(usersWithWorkspaces, workspace.resourceId),
  };
};

export default getWorkspaceCollaborators;
