import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {userListWithWorkspaces} from '../../assignedItems/getAssignedItems';
import {
  checkAuthorization,
  makeWorkspacePermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {checkWorkspaceExists} from '../../workspaces/utils';
import {PermissionDeniedError} from '../../user/errors';
import CollaboratorQueries from '../queries';
import {collaboratorListExtractor, removeOtherUserWorkspaces} from '../utils';
import {GetWorkspaceCollaboratorsEndpoint} from './types';
import {getWorkspaceCollaboratorsJoiSchema} from './validation';

const getWorkspaceCollaborators: GetWorkspaceCollaboratorsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getWorkspaceCollaboratorsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspace = await checkWorkspaceExists(context, data.workspaceId);

  const collaborators = await context.data.user.getManyItems(
    CollaboratorQueries.getByWorkspaceId(data.workspaceId)
  );

  // TODO: can we do this together, so that we don't waste compute
  const permittedReads = await Promise.all(
    collaborators.map(item =>
      checkAuthorization({
        context,
        agent,
        workspace,
        resource: item,
        type: AppResourceType.User,
        permissionOwners: makeWorkspacePermissionOwnerList(
          workspace.resourceId
        ),
        action: BasicCRUDActions.Read,
        nothrow: true,
      })
    )
  );

  const allowedCollaborators = collaborators.filter(
    (item, i) => !!permittedReads[i]
  );

  if (allowedCollaborators.length === 0 && collaborators.length > 0) {
    throw new PermissionDeniedError();
  }

  const usersWithWorkspaces = await userListWithWorkspaces(
    context,
    allowedCollaborators
  );

  return {
    collaborators: collaboratorListExtractor(
      usersWithWorkspaces.map(collaborator =>
        removeOtherUserWorkspaces(collaborator, workspace.resourceId)
      ),
      workspace.resourceId
    ),
  };
};

export default getWorkspaceCollaborators;
