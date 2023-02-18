import {last} from 'lodash';
import {CollaborationRequestStatusType} from '../../../definitions/collaborationRequest';
import {BasicCRUDActions} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {validate} from '../../../utils/validate';
import {NotFoundError} from '../../errors';
import EndpointReusableQueries from '../../queries';
import {
  checkCollaborationRequestAuthorization,
  collaborationRequestExtractor,
  populateRequestAssignedPermissionGroups,
} from '../utils';
import {GetCollaborationRequestEndpoint} from './types';
import {getCollaborationRequestJoiSchema} from './validation';

const getCollaborationRequest: GetCollaborationRequestEndpoint = async (context, instData) => {
  const data = validate(instData.data, getCollaborationRequestJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const request = await context.data.collaborationRequest.getOneByQuery(
    EndpointReusableQueries.getByResourceId(data.requestId)
  );

  appAssert(request, new NotFoundError('Collaboration request not found'));
  const isAccepted =
    last(request.statusHistory)?.status === CollaborationRequestStatusType.Accepted;

  if (request.recipientEmail === agent.user?.email && !isAccepted) {
    // Request sent to user
    return {request: collaborationRequestExtractor(request)};
  }

  await checkCollaborationRequestAuthorization(context, agent, request, BasicCRUDActions.Read);
  const populatedRequest = collaborationRequestExtractor(
    await populateRequestAssignedPermissionGroups(context, request)
  );

  return {request: populatedRequest};
};

export default getCollaborationRequest;
