import {
  CollaborationRequest,
  CollaborationRequestStatusType,
} from '../../../definitions/collaborationRequest';
import {AppActionType, AppResourceType} from '../../../definitions/system';
import {User} from '../../../definitions/user';
import {
  CollaborationRequestEmailProps,
  collaborationRequestEmailHTML,
  collaborationRequestEmailText,
  collaborationRequestEmailTitle,
} from '../../../emailTemplates/collaborationRequest';
import {appAssert} from '../../../utils/assertion';
import {formatDate, getTimestamp} from '../../../utils/dateFns';
import {newWorkspaceResource} from '../../../utils/resource';
import {validate} from '../../../utils/validate';
import {checkAuthorization} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {BaseContextType} from '../../contexts/types';
import {ResourceExistsError} from '../../errors';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {collaborationRequestForWorkspaceExtractor} from '../utils';
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
    workspace: workspace,
    targets: {targetType: AppResourceType.CollaborationRequest},
    action: AppActionType.Create,
  });

  let {request, existingUser} = await executeWithMutationRunOptions(context, async opts => {
    const [existingUser, existingRequest] = await Promise.all([
      context.semantic.user.getByEmail(data.request.recipientEmail),
      context.semantic.collaborationRequest.getOneByWorkspaceIdEmail(
        workspace.resourceId,
        data.request.recipientEmail,
        opts
      ),
    ]);

    if (existingUser) {
      const collaboratorExists =
        await context.semantic.assignedItem.existsByWorkspaceAssignedAndAssigneeIds(
          workspace.resourceId,
          workspace.resourceId,
          existingUser.resourceId,
          opts
        );
      appAssert(
        collaboratorExists === false,
        new ResourceExistsError('Collaborator with same email address exists in this workspace.')
      );
    }

    if (existingRequest?.status === CollaborationRequestStatusType.Pending) {
      throw new ResourceExistsError(
        `An existing collaboration request to this user was sent on ${formatDate(
          existingRequest?.createdAt
        )}`
      );
    }

    const request: CollaborationRequest = newWorkspaceResource(
      agent,
      AppResourceType.CollaborationRequest,
      workspace.resourceId,
      {
        message: data.request.message,
        workspaceName: workspace.name,
        recipientEmail: data.request.recipientEmail,
        expiresAt: data.request.expires,
        status: CollaborationRequestStatusType.Pending,
        statusDate: getTimestamp(),
      }
    );

    await context.semantic.collaborationRequest.insertItem(request, opts);
    return {request, existingUser};
  });

  await sendCollaborationRequestEmail(context, request, existingUser);
  return {request: collaborationRequestForWorkspaceExtractor(request)};
};

async function sendCollaborationRequestEmail(
  context: BaseContextType,
  request: CollaborationRequest,
  toUser: User | null
) {
  const emailProps: CollaborationRequestEmailProps = {
    workspaceName: request.workspaceName,
    isRecipientAUser: !!toUser,
    loginLink: context.appVariables.clientLoginLink,
    signupLink: context.appVariables.clientSignupLink,
    expires: request.expiresAt,
    message: request.message,
    firstName: toUser?.firstName,
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
