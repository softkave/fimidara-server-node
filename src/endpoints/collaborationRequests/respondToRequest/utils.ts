import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {SemanticProviderMutationParams} from '../../../contexts/semantic/types.js';
import {
  CollaborationRequest,
  kCollaborationRequestStatusTypeMap,
} from '../../../definitions/collaborationRequest.js';
import {
  EmailJobParams,
  kEmailJobType,
  kJobType,
} from '../../../definitions/job.js';
import {
  SessionAgent,
  kFimidaraResourceType,
} from '../../../definitions/system.js';
import {kSystemSessionAgent} from '../../../utils/agent.js';
import {appAssert} from '../../../utils/assertion.js';
import {formatDate, getTimestamp} from '../../../utils/dateFns.js';
import {ServerStateConflictError} from '../../../utils/errors.js';
import {isStringEqual} from '../../../utils/fns.js';
import {assignWorkspaceToUser} from '../../assignedItems/addAssignedItems.js';
import {queueJobs} from '../../jobs/queueJobs.js';
import {PermissionDeniedError} from '../../users/errors.js';
import {assertUser} from '../../users/utils.js';
import {assertWorkspace} from '../../workspaces/utils.js';
import {assertCollaborationRequest} from '../utils.js';
import {RespondToCollaborationRequestEndpointParams} from './types.js';

export const INTERNAL_RespondToCollaborationRequest = async (
  agent: SessionAgent,
  data: RespondToCollaborationRequestEndpointParams,
  opts: SemanticProviderMutationParams
) => {
  const request = await kIjxSemantic
    .collaborationRequest()
    .getOneById(data.requestId, opts);
  assertCollaborationRequest(request);
  const user = agent.user;
  assertUser(user);
  appAssert(
    isStringEqual(user.email, request.recipientEmail),
    new PermissionDeniedError('User is not the collaboration request recipient')
  );

  const isExpired =
    request.expiresAt && new Date(request.expiresAt).valueOf() < Date.now();
  const isAccepted =
    data.response === kCollaborationRequestStatusTypeMap.Accepted;

  if (isExpired) {
    throw new ServerStateConflictError(
      `Collaboration request expired on ${formatDate(request.expiresAt!)}`
    );
  }

  const [updatedRequest] = await Promise.all([
    kIjxSemantic
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

export async function notifySenderOnCollaborationRequestResponse(
  request: CollaborationRequest
) {
  const workspace = await kIjxSemantic
    .workspace()
    .getOneById(request.workspaceId);
  assertWorkspace(workspace);
  const sender =
    request.createdBy.agentType === kFimidaraResourceType.User ||
    workspace.createdBy.agentType === kFimidaraResourceType.User
      ? // TODO: check if agent is a user or associated type before fetching
        await kIjxSemantic
          .user()
          .getOneById(
            request.createdBy.agentType === kFimidaraResourceType.User
              ? request.createdBy.agentId
              : workspace.createdBy.agentId
          )
      : null;

  if (sender && sender.isEmailVerified) {
    kIjxUtils.promises().callAndForget(() =>
      queueJobs<EmailJobParams>(workspace.resourceId, undefined, {
        createdBy: kSystemSessionAgent,
        type: kJobType.email,
        idempotencyToken: Date.now().toString(),
        params: {
          type: kEmailJobType.collaborationRequestResponse,
          emailAddress: [sender.email],
          userId: [sender.resourceId],
          params: {requestId: request.resourceId},
        },
      })
    );
  }
}
