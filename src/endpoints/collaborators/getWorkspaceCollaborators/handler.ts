import {IAssignedItem} from '../../../definitions/assignedItem';
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {IUserWithWorkspace} from '../../../definitions/user';
import {validate} from '../../../utils/validate';
import {populateUserListWithWorkspaces} from '../../assignedItems/getAssignedItems';
import AssignedItemQueries from '../../assignedItems/queries';
import {
  makeWorkspacePermissionContainerList,
  summarizeAgentPermissionItems,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {getWorkspaceId} from '../../contexts/SessionContext';
import EndpointReusableQueries from '../../queries';
import {PermissionDeniedError} from '../../user/errors';
import {getEndpointPageFromInput} from '../../utils';
import {checkWorkspaceExists} from '../../workspaces/utils';
import {collaboratorListExtractor} from '../utils';
import {GetWorkspaceCollaboratorsEndpoint} from './types';
import {getWorkspaceCollaboratorsJoiSchema} from './validation';

const getWorkspaceCollaborators: GetWorkspaceCollaboratorsEndpoint = async (context, instData) => {
  const data = validate(instData.data, getWorkspaceCollaboratorsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceId(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(context, workspaceId);
  const permissionsSummaryReport = await summarizeAgentPermissionItems({
    context,
    agent,
    workspace,
    type: AppResourceType.User,
    permissionContainers: makeWorkspacePermissionContainerList(workspace.resourceId),
    action: BasicCRUDActions.Read,
  });

  let assignedItems: Array<IAssignedItem> = [];
  if (permissionsSummaryReport.hasFullOrLimitedAccess) {
    assignedItems = await context.data.assignedItem.getManyByQuery(
      AssignedItemQueries.getWorkspaceCollaborators(
        workspace.resourceId,
        undefined,
        permissionsSummaryReport.deniedResourceIdList
      ),
      data
    );
  } else if (permissionsSummaryReport.allowedResourceIdList) {
    assignedItems = await context.data.assignedItem.getManyByQuery(
      AssignedItemQueries.getWorkspaceCollaborators(
        workspace.resourceId,
        permissionsSummaryReport.allowedResourceIdList
      ),
      data
    );
  } else if (permissionsSummaryReport.noAccess) {
    throw new PermissionDeniedError();
  }

  let usersWithWorkspaces: IUserWithWorkspace[] = [];
  if (assignedItems.length > 0) {
    const userIdList = assignedItems.map(item => item.assignedToItemId);
    const users = await context.data.user.getManyByQuery(EndpointReusableQueries.getByResourceIdList(userIdList));

    // TODO: only populate the calling workspace
    usersWithWorkspaces = await populateUserListWithWorkspaces(context, users);
  }

  return {
    page: getEndpointPageFromInput(data),
    collaborators: collaboratorListExtractor(usersWithWorkspaces, workspace.resourceId),
  };
};

export default getWorkspaceCollaborators;
