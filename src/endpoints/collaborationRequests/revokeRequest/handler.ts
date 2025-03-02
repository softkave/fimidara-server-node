import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {kCollaborationRequestStatusTypeMap} from '../../../definitions/collaborationRequest.js';
import {
  EmailJobParams,
  kEmailJobType,
  kJobType,
} from '../../../definitions/job.js';
import {appAssert} from '../../../utils/assertion.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {validate} from '../../../utils/validate.js';
import {InvalidRequestError} from '../../errors.js';
import {queueJobs} from '../../jobs/queueJobs.js';
import {
  assertCollaborationRequest,
  checkCollaborationRequestAuthorization02,
  collaborationRequestForWorkspaceExtractor,
} from '../utils.js';
import {RevokeCollaborationRequestEndpoint} from './types.js';
import {revokeCollaborationRequestJoiSchema} from './validation.js';

const revokeCollaborationRequest: RevokeCollaborationRequestEndpoint =
  async reqData => {
    const data = validate(reqData.data, revokeCollaborationRequestJoiSchema);
    const agent = await kIjxUtils
      .session()
      .getAgentFromReq(
        reqData,
        kSessionUtils.permittedAgentTypes.api,
        kSessionUtils.accessScopes.api
      );

    const {request, workspace} = await kIjxSemantic
      .utils()
      .withTxn(async opts => {
        const {request, workspace} =
          await checkCollaborationRequestAuthorization02(
            agent,
            data.requestId,
            'revokeCollaborationRequest',
            opts
          );

        const isRevoked =
          request.status === kCollaborationRequestStatusTypeMap.Revoked;
        appAssert(
          isRevoked === false,
          new InvalidRequestError('Collaboration request already revoked')
        );
        const updatedRequest = await kIjxSemantic
          .collaborationRequest()
          .getAndUpdateOneById(
            data.requestId,
            {
              statusDate: getTimestamp(),
              status: kCollaborationRequestStatusTypeMap.Revoked,
            },
            opts
          );

        assertCollaborationRequest(updatedRequest);
        return {workspace, request: updatedRequest};
      });

    kIjxUtils.promises().callAndForget(() =>
      queueJobs<EmailJobParams>(workspace.resourceId, undefined, {
        type: kJobType.email,
        createdBy: agent,
        idempotencyToken: Date.now().toString(),
        params: {
          type: kEmailJobType.collaborationRequestRevoked,
          emailAddress: [request.recipientEmail],
          userId: [],
          params: {requestId: request.resourceId},
        },
      })
    );

    return {request: collaborationRequestForWorkspaceExtractor(request)};
  };

export default revokeCollaborationRequest;
