import {
  CollaborationRequest,
  kCollaborationRequestStatusTypeMap,
} from '../../../definitions/collaborationRequest';
import {EmailJobParams, kEmailJobType, kJobType} from '../../../definitions/job';
import {SessionAgent, kFimidaraResourceType} from '../../../definitions/system';
import {kSystemSessionAgent} from '../../../utils/agent';
import {appAssert} from '../../../utils/assertion';
import {formatDate, getTimestamp} from '../../../utils/dateFns';
import {ServerStateConflictError} from '../../../utils/errors';
import {isStringEqual} from '../../../utils/fns';
import {assignWorkspaceToUser} from '../../assignedItems/addAssignedItems';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {SemanticProviderMutationTxnOptions} from '../../contexts/semantic/types';
import {queueJobs} from '../../jobs/queueJobs';
import {PermissionDeniedError} from '../../users/errors';
import {assertUser} from '../../users/utils';
import {assertWorkspace} from '../../workspaces/utils';
import {assertCollaborationRequest} from '../utils';
import {RespondToCollaborationRequestEndpointParams} from './types';

export const INTERNAL_RespondToCollaborationRequest = async (
  agent: SessionAgent,
  data: RespondToCollaborationRequestEndpointParams,
  opts: SemanticProviderMutationTxnOptions
) => {
  const request = await kSemanticModels
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
  const isAccepted = data.response === kCollaborationRequestStatusTypeMap.Accepted;

  if (isExpired) {
    throw new ServerStateConflictError(
      `Collaboration request expired on ${formatDate(request.expiresAt!)}`
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

export async function notifySenderOnCollaborationRequestResponse(
  request: CollaborationRequest
) {
  const workspace = await kSemanticModels.workspace().getOneById(request.workspaceId);
  assertWorkspace(workspace);
  const sender =
    request.createdBy.agentType === kFimidaraResourceType.User ||
    workspace.createdBy.agentType === kFimidaraResourceType.User
      ? // TODO: check if agent is a user or associated type before fetching
        await kSemanticModels
          .user()
          .getOneById(
            request.createdBy.agentType === kFimidaraResourceType.User
              ? request.createdBy.agentId
              : workspace.createdBy.agentId
          )
      : null;

  if (sender && sender.isEmailVerified) {
    kUtilsInjectables.promises().forget(
      // queueEmailMessage(
      //   sender.email,
      //   {
      //     type: kEmailMessageType.collaborationRequestResponse,
      //     params: {requestId: request.resourceId},
      //   },
      //   workspace.resourceId,
      //   sender.resourceId,
      //   {reuseTxn: false}
      // )

      queueJobs<EmailJobParams>(workspace.resourceId, undefined, {
        createdBy: kSystemSessionAgent,
        type: kJobType.email,
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
