import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {kCollaborationRequestStatusTypeMap} from '../../../definitions/collaborationRequest.js';
import {
  EmailJobParams,
  kEmailJobType,
  kJobType,
} from '../../../definitions/job.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {validate} from '../../../utils/validate.js';
import {InvalidRequestError} from '../../errors.js';
import {queueJobs} from '../../jobs/queueJobs.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {
  assertCollaborationRequest,
  checkCollaborationRequestAuthorization02,
  collaborationRequestForWorkspaceExtractor,
} from '../utils.js';
import {RevokeCollaborationRequestEndpoint} from './types.js';
import {revokeCollaborationRequestJoiSchema} from './validation.js';

const revokeCollaborationRequestEndpoint: RevokeCollaborationRequestEndpoint =
  async reqData => {
    const data = validate(reqData.data, revokeCollaborationRequestJoiSchema);
    const {agent, workspaceId} = await initEndpoint(reqData, {data});

    const {request} = await kSemanticModels.utils().withTxn(async opts => {
      const {request} = await checkCollaborationRequestAuthorization02({
        agent,
        workspaceId,
        requestId: data.requestId,
        action: kFimidaraPermissionActions.revokeCollaborationRequest,
      });

      const isRevoked =
        request.status === kCollaborationRequestStatusTypeMap.Revoked;
      appAssert(
        isRevoked === false,
        new InvalidRequestError('Collaboration request already revoked')
      );
      const updatedRequest = await kSemanticModels
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
      return {request: updatedRequest};
    });

    kUtilsInjectables.promises().forget(
      queueJobs<EmailJobParams>(workspaceId, /** parentJobId */ undefined, {
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

export default revokeCollaborationRequestEndpoint;
