import {IUserWithWorkspace} from '../../../definitions/user';
import {validate} from '../../../utils/validate';
import {populateUserListWithWorkspaces} from '../../assignedItems/getAssignedItems';
import {getWorkspaceIdFromSessionAgent} from '../../contexts/SessionContext';
import EndpointReusableQueries from '../../queries';
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
  const q = await getWorkspaceCollaboratorsQuery(context, agent, workspace);
  applyDefaultEndpointPaginationOptions(data);
  const assignedItems = await context.data.assignedItem.getManyByQuery(q, data);
  let usersWithWorkspaces: IUserWithWorkspace[] = [];
  if (assignedItems.length > 0) {
    const userIdList = assignedItems.map(item => item.assignedToItemId);
    const users = await context.data.user.getManyByQuery(
      EndpointReusableQueries.getByResourceIdList(userIdList)
    );

    // TODO: only populate the calling workspace
    usersWithWorkspaces = await populateUserListWithWorkspaces(context, users);
  }

  return {
    page: getEndpointPageFromInput(data),
    collaborators: collaboratorListExtractor(usersWithWorkspaces, workspace.resourceId),
  };
};

export default getWorkspaceCollaborators;
