import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {populateUserListWithWorkspaces} from '../../assignedItems/getAssignedItems';
import AssignedItemQueries from '../../assignedItems/queries';
import {
  checkAuthorization,
  makeWorkspacePermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {getWorkspaceId} from '../../contexts/SessionContext';
import {PermissionDeniedError} from '../../user/errors';
import {checkWorkspaceExists} from '../../workspaces/utils';
import CollaboratorQueries from '../queries';
import {collaboratorListExtractor, removeOtherUserWorkspaces} from '../utils';
import {GetWorkspaceCollaboratorsEndpoint} from './types';
import {getWorkspaceCollaboratorsJoiSchema} from './validation';

const getWorkspaceCollaborators: GetWorkspaceCollaboratorsEndpoint = async (context, instData) => {
  const data = validate(instData.data, getWorkspaceCollaboratorsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceId(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(context, workspaceId);
  const assignedItems = await context.data.assignedItem.getManyByQuery(
    AssignedItemQueries.getByAssignedItem(workspace.resourceId, workspace.resourceId, AppResourceType.Workspace)
  );

  const userIdList = assignedItems.map(item => item.assignedToItemId);
  const collaborators = await context.data.user.getManyByQuery(CollaboratorQueries.getByIds(userIdList));

  // TODO: can we do this together, so that we don't waste compute
  const permittedReads = await Promise.all(
    collaborators.map(item =>
      checkAuthorization({
        context,
        agent,
        workspace,
        resource: item,
        type: AppResourceType.User,
        permissionOwners: makeWorkspacePermissionOwnerList(workspace.resourceId),
        action: BasicCRUDActions.Read,
        nothrow: true,
      })
    )
  );

  const allowedCollaborators = collaborators.filter((item, i) => !!permittedReads[i]);

  if (allowedCollaborators.length === 0 && collaborators.length > 0) {
    throw new PermissionDeniedError();
  }

  const usersWithWorkspaces = await populateUserListWithWorkspaces(context, allowedCollaborators);

  return {
    collaborators: collaboratorListExtractor(
      usersWithWorkspaces.map(collaborator => removeOtherUserWorkspaces(collaborator, workspace.resourceId)),
      workspace.resourceId
    ),
  };
};

export default getWorkspaceCollaborators;
