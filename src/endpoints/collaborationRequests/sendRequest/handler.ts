import {CollaborationRequestStatusType, ICollaborationRequest} from '../../../definitions/collaborationRequest';
import {AppResourceType, BasicCRUDActions, IAgent} from '../../../definitions/system';
import {IUser} from '../../../definitions/user';
import {
  collaborationRequestEmailHTML,
  collaborationRequestEmailText,
  collaborationRequestEmailTitle,
  ICollaborationRequestEmailProps,
} from '../../../email-templates/collaborationRequest';
import {formatDate, getDateString} from '../../../utils/dateFns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {validate} from '../../../utils/validate';
import {addAssignedPermissionGroupList} from '../../assignedItems/addAssignedItems';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import CollaboratorQueries from '../../collaborators/queries';
import {getCollaboratorWorkspace} from '../../collaborators/utils';
import {
  checkAuthorization,
  makeWorkspacePermissionContainerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {getWorkspaceId} from '../../contexts/SessionContext';
import {IBaseContext} from '../../contexts/types';
import {ResourceExistsError} from '../../errors';
import {checkWorkspaceExists} from '../../workspaces/utils';
import CollaborationRequestQueries from '../queries';
import {collaborationRequestExtractor, populateRequestPermissionGroups} from '../utils';
import {SendCollaborationRequestEndpoint} from './types';
import {sendCollaborationRequestJoiSchema} from './validation';

const sendCollaborationRequest: SendCollaborationRequestEndpoint = async (context, instData) => {
  const data = validate(instData.data, sendCollaborationRequestJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceId(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(context, workspaceId);
  await checkAuthorization({
    context,
    agent,
    workspace,
    type: AppResourceType.CollaborationRequest,
    permissionContainers: makeWorkspacePermissionContainerList(workspace.resourceId),
    action: BasicCRUDActions.Create,
  });

  let collaboratorExists = false;
  const existingUser = await context.data.user.getOneByQuery(
    CollaboratorQueries.getByUserEmail(data.request.recipientEmail)
  );

  if (existingUser) {
    const existingUserWithWorkspaces = await populateUserWorkspaces(context, existingUser);

    collaboratorExists = !!(existingUser && getCollaboratorWorkspace(existingUserWithWorkspaces, workspaceId));
  }

  if (collaboratorExists) {
    throw new ResourceExistsError('Collaborator with same email address exists');
  }

  const existingRequest = await context.data.collaborationRequest.getOneByQuery(
    CollaborationRequestQueries.getByWorkspaceIdAndUserEmail(workspaceId, data.request.recipientEmail)
  );

  if (existingRequest) {
    const status = existingRequest.statusHistory[existingRequest.statusHistory.length - 1];

    if (status.status === CollaborationRequestStatusType.Pending) {
      throw new ResourceExistsError(
        `An existing collaboration request to this user was sent on ${formatDate(existingRequest.createdAt)}`
      );
    }
  }

  const createdAt = getDateString();
  const createdBy: IAgent = {
    agentId: agent.agentId,
    agentType: agent.agentType,
  };

  let request = await context.data.collaborationRequest.insertItem({
    createdAt,
    createdBy,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    resourceId: getNewIdForResource(AppResourceType.CollaborationRequest),
    message: data.request.message,
    workspaceName: workspace.name,
    workspaceId: workspace.resourceId,
    recipientEmail: data.request.recipientEmail,
    expiresAt: data.request.expires,
    statusHistory: [
      {
        status: CollaborationRequestStatusType.Pending,
        date: createdAt,
      },
    ],
  });

  if (data.request.permissionGroupsOnAccept && data.request.permissionGroupsOnAccept.length > 0) {
    await addAssignedPermissionGroupList(
      context,
      agent,
      workspace,
      data.request.permissionGroupsOnAccept,
      request.resourceId,
      AppResourceType.CollaborationRequest,
      /** deleteExisting */ false
    );
  }

  await sendCollaborationRequestEmail(context, request, existingUser);
  request = await populateRequestPermissionGroups(context, request);
  return {
    request: collaborationRequestExtractor(request),
  };
};

async function sendCollaborationRequestEmail(
  context: IBaseContext,
  request: ICollaborationRequest,
  toUser: IUser | null
) {
  const emailProps: ICollaborationRequestEmailProps = {
    workspaceName: request.workspaceName,
    isRecipientAUser: !!toUser,
    loginLink: context.appVariables.clientLoginLink,
    signupLink: context.appVariables.clientSignupLink,
    expires: request.expiresAt,
    message: request.message,
  };

  const html = collaborationRequestEmailHTML(emailProps);
  const text = collaborationRequestEmailText(emailProps);
  await context.email.sendEmail(context, {
    subject: collaborationRequestEmailTitle(request.workspaceName),
    body: {html, text},
    destination: [request.recipientEmail],
    source: context.appVariables.appDefaultEmailAddressFrom,
  });
}

export default sendCollaborationRequest;
