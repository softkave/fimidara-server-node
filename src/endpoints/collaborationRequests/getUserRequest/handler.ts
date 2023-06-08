import {appAssert} from '../../../utils/assertion';
import {reuseableErrors} from '../../../utils/reusableErrors';
import {validate} from '../../../utils/validate';
import {assertCollaborationRequest, collaborationRequestForUserExtractor} from '../utils';
import {GetUserCollaborationRequestEndpoint} from './types';
import {getUserCollaborationRequestJoiSchema} from './validation';

const getUserCollaborationRequest: GetUserCollaborationRequestEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getUserCollaborationRequestJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const request = await context.semantic.collaborationRequest.getOneById(data.requestId);
  assertCollaborationRequest(request);
  appAssert(
    request.recipientEmail === agent.user?.email,
    reuseableErrors.collaborationRequest.notFound()
  );
  return {request: collaborationRequestForUserExtractor(request)};
};

export default getUserCollaborationRequest;
