import {
  CollaborationRequest,
  CollaborationRequestResponse,
  CollaborationRequestStatusTypeMap,
} from '../../../definitions/collaborationRequest';
import {SessionAgent, kAppResourceType} from '../../../definitions/system';
import {User} from '../../../definitions/user';
import {
  CollaborationRequestResponseEmailProps,
  collaborationRequestResponseEmailHTML,
  collaborationRequestResponseEmailText,
  collaborationRequestResponseEmailTitle,
} from '../../../emailTemplates/collaborationRequestResponse';
import {appAssert} from '../../../utils/assertion';
import {formatDate, getTimestamp} from '../../../utils/dateFns';
import {ServerStateConflictError} from '../../../utils/errors';
import {isStringEqual} from '../../../utils/fns';
import {assignWorkspaceToUser} from '../../assignedItems/addAssignedItems';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injectables';
import {SemanticProviderMutationRunOptions} from '../../contexts/semantic/types';
import {PermissionDeniedError} from '../../users/errors';
import {assertUser} from '../../users/utils';
import {assertWorkspace} from '../../workspaces/utils';
import {assertCollaborationRequest} from '../utils';
import {RespondToCollaborationRequestEndpointParams} from './types';

async function sendCollaborationRequestResponseEmail(
  request: CollaborationRequest,
  response: CollaborationRequestResponse,
  toUser: User
) {
  const suppliedConfig = kUtilsInjectables.suppliedConfig();
  appAssert(suppliedConfig.clientLoginLink);
  appAssert(suppliedConfig.clientSignupLink);
  appAssert(suppliedConfig.appDefaultEmailAddressFrom);

  const emailProps: CollaborationRequestResponseEmailProps = {
    response,
    workspaceName: request.workspaceName,
    loginLink: suppliedConfig.clientLoginLink,
    signupLink: suppliedConfig.clientSignupLink,
    recipientEmail: request.recipientEmail,
    firstName: toUser?.firstName,
  };
  const html = collaborationRequestResponseEmailHTML(emailProps);
  const text = collaborationRequestResponseEmailText(emailProps);
  await kUtilsInjectables.email().sendEmail({
    subject: collaborationRequestResponseEmailTitle(emailProps),
    body: {html, text},
    destination: [toUser.email],
    source: suppliedConfig.appDefaultEmailAddressFrom,
  });
}

export const INTERNAL_RespondToCollaborationRequest = async (
  agent: SessionAgent,
  data: RespondToCollaborationRequestEndpointParams,
  opts: SemanticProviderMutationRunOptions
) => {
  const request = await kSemanticModels
    .collaborationRequest()
    .getOneById(data.requestId, opts);
  assertCollaborationRequest(request);
  const user = agent.user;
  assertUser(user);
  appAssert(
    isStringEqual(user.email, request.recipientEmail),
    new PermissionDeniedError('User is not the collaboration request recipient.')
  );

  const isExpired =
    request.expiresAt && new Date(request.expiresAt).valueOf() < Date.now();
  const isAccepted = data.response === CollaborationRequestStatusTypeMap.Accepted;

  if (isExpired) {
    throw new ServerStateConflictError(
      `Collaboration request expired on ${formatDate(request.expiresAt!)}.`
    );
  }

  const [updatedRequest] = await Promise.all([
    kSemanticModels
      .collaborationRequest()
      .getAndUpdateOneById(
        data.requestId,
        {statusDate: getTimestamp(), status: data.response},
        opts
      ),
    isAccepted &&
      assignWorkspaceToUser(
        request.createdBy,
        request.workspaceId,
        user.resourceId,
        opts
      ),
  ]);

  assertCollaborationRequest(updatedRequest);
  return updatedRequest;
};

export async function notifyUserOnCollaborationRequestResponse(
  request: CollaborationRequest,
  response: CollaborationRequestResponse
) {
  const workspace = await kSemanticModels.workspace().getOneById(request.workspaceId);
  assertWorkspace(workspace);
  const notifyUser =
    request.createdBy.agentType === kAppResourceType.User ||
    workspace.createdBy.agentType === kAppResourceType.User
      ? // TODO: check if agent is a user or associated type before fetching
        await kSemanticModels
          .user()
          .getOneById(
            request.createdBy.agentType === kAppResourceType.User
              ? request.createdBy.agentId
              : workspace.createdBy.agentId
          )
      : null;

  if (notifyUser && notifyUser.isEmailVerified) {
    await sendCollaborationRequestResponseEmail(request, response, notifyUser);
  }
}
