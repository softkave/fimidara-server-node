import {
  CollaborationRequest,
  CollaborationRequestStatusTypeMap,
} from '../../../definitions/collaborationRequest';
import {AppResourceTypeMap} from '../../../definitions/system';
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
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injectables';
import {ResourceExistsError} from '../../errors';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {collaborationRequestForWorkspaceExtractor} from '../utils';
import {SendCollaborationRequestEndpoint} from './types';
import {sendCollaborationRequestJoiSchema} from './validation';

const sendCollaborationRequest: SendCollaborationRequestEndpoint = async instData => {
  const data = validate(instData.data, sendCollaborationRequestJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
  await checkAuthorizationWithAgent({
    agent,
    workspaceId: workspace.resourceId,
    workspace: workspace,
    target: {targetId: workspace.resourceId, action: 'addCollaborator'},
  });

  const {request, existingUser} = await kSemanticModels.utils().withTxn(async opts => {
    const [existingUser, existingRequest] = await Promise.all([
      kSemanticModels.user().getByEmail(data.request.recipientEmail),
      kSemanticModels
        .collaborationRequest()
        .getOneByWorkspaceIdEmail(
          workspace.resourceId,
          data.request.recipientEmail,
          opts
        ),
    ]);

    if (existingUser) {
      const collaboratorExists = await kSemanticModels
        .assignedItem()
        .existsByWorkspaceAssignedAndAssigneeIds(
          workspace.resourceId,
          workspace.resourceId,
          existingUser.resourceId,
          opts
        );
      appAssert(
        collaboratorExists === false,
        new ResourceExistsError(
          'Collaborator with same email address exists in this workspace.'
        )
      );
    }

    if (existingRequest?.status === CollaborationRequestStatusTypeMap.Pending) {
      throw new ResourceExistsError(
        `An existing collaboration request to this user was sent on ${formatDate(
          existingRequest?.createdAt
        )}`
      );
    }

    const request: CollaborationRequest = newWorkspaceResource(
      agent,
      AppResourceTypeMap.CollaborationRequest,
      workspace.resourceId,
      {
        message: data.request.message,
        workspaceName: workspace.name,
        recipientEmail: data.request.recipientEmail,
        expiresAt: data.request.expires,
        status: CollaborationRequestStatusTypeMap.Pending,
        statusDate: getTimestamp(),
      }
    );

    await kSemanticModels.collaborationRequest().insertItem(request, opts);
    return {request, existingUser};
  });

  await sendCollaborationRequestEmail(request, existingUser);
  return {request: collaborationRequestForWorkspaceExtractor(request)};
};

async function sendCollaborationRequestEmail(
  request: CollaborationRequest,
  toUser: User | null
) {
  const emailProps: CollaborationRequestEmailProps = {
    workspaceName: request.workspaceName,
    isRecipientAUser: !!toUser,
    loginLink: kUtilsInjectables.config().clientLoginLink,
    signupLink: kUtilsInjectables.config().clientSignupLink,
    expires: request.expiresAt,
    message: request.message,
    firstName: toUser?.firstName,
  };
  const html = collaborationRequestEmailHTML(emailProps);
  const text = collaborationRequestEmailText(emailProps);
  await kUtilsInjectables.email().sendEmail({
    subject: collaborationRequestEmailTitle(request.workspaceName),
    body: {html, text},
    destination: [request.recipientEmail],
    source: kUtilsInjectables.config().appDefaultEmailAddressFrom,
  });
}

export default sendCollaborationRequest;
