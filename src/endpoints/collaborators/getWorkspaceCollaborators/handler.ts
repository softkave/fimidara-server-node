import {UserWithWorkspace} from '../../../definitions/user';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {populateUserListWithWorkspaces} from '../../assignedItems/getAssignedItems';
import {applyDefaultEndpointPaginationOptions, getEndpointPageFromInput} from '../../utils';
import {checkWorkspaceExists} from '../../workspaces/utils';
import {collaboratorListExtractor} from '../utils';
import {GetWorkspaceCollaboratorsEndpoint} from './types';
import {getWorkspaceCollaboratorsQuery} from './utils';
import {getWorkspaceCollaboratorsJoiSchema} from './validation';

const getWorkspaceCollaborators: GetWorkspaceCollaboratorsEndpoint = async (context, instData) => {
  const data = validate(instData.data, getWorkspaceCollaboratorsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(context, workspaceId);
  const assignedItemsQuery = await getWorkspaceCollaboratorsQuery(context, agent, workspace);
  applyDefaultEndpointPaginationOptions(data);
  const assignedItems = await context.semantic.assignedItem.getManyByQuery(
    assignedItemsQuery,
    data
  );
  let usersWithWorkspaces: UserWithWorkspace[] = [];
  if (assignedItems.length > 0) {
    const userIdList = assignedItems.map(item => item.assigneeId);
    const users = await context.semantic.user.getManyByIdList(userIdList);

    // TODO: only populate the calling workspace
    usersWithWorkspaces = await populateUserListWithWorkspaces(context, users);
  }

  return {
    page: getEndpointPageFromInput(data),
    collaborators: collaboratorListExtractor(usersWithWorkspaces, workspace.resourceId),
  };
};

export default getWorkspaceCollaborators;
