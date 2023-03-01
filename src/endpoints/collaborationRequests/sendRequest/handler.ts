import {
  CollaborationRequestStatusType,
  ICollaborationRequest,
} from '../../../definitions/collaborationRequest';
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {IUser} from '../../../definitions/user';
import {
  collaborationRequestEmailHTML,
  collaborationRequestEmailText,
  collaborationRequestEmailTitle,
  ICollaborationRequestEmailProps,
} from '../../../email-templates/collaborationRequest';
import {formatDate, getTimestamp} from '../../../utils/dateFns';
import {newResource} from '../../../utils/fns';
import {validate} from '../../../utils/validate';
import {addAssignedPermissionGroupList} from '../../assignedItems/addAssignedItems';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import CollaboratorQueries from '../../collaborators/queries';
import {getCollaboratorWorkspace} from '../../collaborators/utils';
import {checkAuthorization} from '../../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../../contexts/types';
import {ResourceExistsError} from '../../errors';
import {getWorkspaceFromEndpointInput} from '../../utils';
import CollaborationRequestQueries from '../queries';
import {
  collaborationRequestForWorkspaceExtractor,
  populateRequestAssignedPermissionGroups,
} from '../utils';
import {SendCollaborationRequestEndpoint} from './types';
import {sendCollaborationRequestJoiSchema} from './validation';

const sendCollaborationRequest: SendCollaborationRequestEndpoint = async (context, instData) => {
  const data = validate(instData.data, sendCollaborationRequestJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  await checkAuthorization({
    context,
    agent,
    workspaceId: workspace.resourceId,
    targets: [{type: AppResourceType.CollaborationRequest}],
    action: BasicCRUDActions.Create,
  });

  let collaboratorExists = false;
  const existingUser = await context.data.user.getOneByQuery(
    CollaboratorQueries.getByUserEmail(data.request.recipientEmail)
  );

  if (existingUser) {
    const existingUserWithWorkspaces = await populateUserWorkspaces(context, existingUser);
    collaboratorExists = !!(
      existingUser && getCollaboratorWorkspace(existingUserWithWorkspaces, workspace.resourceId)
    );
  }

  if (collaboratorExists) {
    throw new ResourceExistsError('Collaborator with same email address exists');
  }

  const existingRequest = await context.data.collaborationRequest.getOneByQuery(
    CollaborationRequestQueries.getByWorkspaceIdAndUserEmail(
      workspace.resourceId,
      data.request.recipientEmail
    )
  );

  if (existingRequest) {
    const status = existingRequest.statusHistory[existingRequest.statusHistory.length - 1];
    if (status.status === CollaborationRequestStatusType.Pending) {
      throw new ResourceExistsError(
        `An existing collaboration request to this user was sent on ${formatDate(
          existingRequest.createdAt
        )}`
      );
    }
  }

  let request: ICollaborationRequest = newResource(agent, AppResourceType.CollaborationRequest, {
    message: data.request.message,
    workspaceName: workspace.name,
    workspaceId: workspace.resourceId,
    recipientEmail: data.request.recipientEmail,
    expiresAt: data.request.expires,
    statusHistory: [
      {
        status: CollaborationRequestStatusType.Pending,
        date: getTimestamp(),
      },
    ],
  });
  await context.semantic.collaborationRequest.insertItem(request);

  if (
    data.request.permissionGroupsAssignedOnAcceptingRequest &&
    data.request.permissionGroupsAssignedOnAcceptingRequest.length > 0
  ) {
    await addAssignedPermissionGroupList(
      context,
      agent,
      workspace.resourceId,
      data.request.permissionGroupsAssignedOnAcceptingRequest,
      request.resourceId,
      /** deleteExisting */ false
    );
  }

  await sendCollaborationRequestEmail(context, request, existingUser);
  request = await populateRequestAssignedPermissionGroups(context, request);
  return {
    request: collaborationRequestForWorkspaceExtractor(request),
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
