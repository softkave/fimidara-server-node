import {kCollaborationRequestStatusTypeMap} from '../../../definitions/collaborationRequest';
import {EmailJobParams, kJobType, kEmailJobType} from '../../../definitions/job';
import {appAssert} from '../../../utils/assertion';
import {getTimestamp} from '../../../utils/dateFns';
import {validate} from '../../../utils/validate';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {InvalidRequestError} from '../../errors';
import {queueJobs} from '../../jobs/queueJobs';
import {
  assertCollaborationRequest,
  checkCollaborationRequestAuthorization02,
  collaborationRequestForWorkspaceExtractor,
} from '../utils';
import {RevokeCollaborationRequestEndpoint} from './types';
import {revokeCollaborationRequestJoiSchema} from './validation';

const revokeCollaborationRequest: RevokeCollaborationRequestEndpoint = async instData => {
  const data = validate(instData.data, revokeCollaborationRequestJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);

  const {request, workspace} = await kSemanticModels.utils().withTxn(async opts => {
    const {request, workspace} = await checkCollaborationRequestAuthorization02(
      agent,
      data.requestId,
      'revokeCollaborationRequest',
      opts
    );

    const isRevoked = request.status === kCollaborationRequestStatusTypeMap.Revoked;
    appAssert(
      isRevoked === false,
      new InvalidRequestError('Collaboration request already revoked')
    );
    const updatedRequest = await kSemanticModels
      .collaborationRequest()
      .getAndUpdateOneById(
        data.requestId,
        {statusDate: getTimestamp(), status: kCollaborationRequestStatusTypeMap.Revoked},
        opts
      );

    assertCollaborationRequest(updatedRequest);
    return {workspace, request: updatedRequest};
  }, /** reuseTxn */ false);

  kUtilsInjectables.promises().forget(
    // queueEmailMessage(
    //   request.recipientEmail,
    //   {
    //     type: kEmailMessageType.collaborationRequestRevoked,
    //     params: {requestId: request.resourceId},
    //   },
    //   workspace.resourceId,
    //   undefined,
    //   {reuseTxn: false}
    // )

    queueJobs<EmailJobParams>(workspace.resourceId, undefined, {
      type: kJobType.email,
      createdBy: agent,
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
