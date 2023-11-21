import {AppResourceTypeMap} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {collaborationRequestForUserExtractor} from '../utils';
import {RespondToCollaborationRequestEndpoint} from './types';
import {
  INTERNAL_RespondToCollaborationRequest,
  notifyUserOnCollaborationRequestResponse,
} from './utils';
import {respondToCollaborationRequestJoiSchema} from './validation';

const respondToCollaborationRequest: RespondToCollaborationRequestEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, respondToCollaborationRequestJoiSchema);
  const agent = await context.session.getAgent(
    context,
    instData,
    AppResourceTypeMap.User
  );
  const request = await context.semantic.utils.withTxn(context, async opts => {
    return await INTERNAL_RespondToCollaborationRequest(context, agent, data, opts);
  });
  await notifyUserOnCollaborationRequestResponse(context, request, data.response);
  return {request: collaborationRequestForUserExtractor(request)};
};

export default respondToCollaborationRequest;
