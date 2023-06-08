import {AppResourceType} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {collaborationRequestForUserExtractor} from '../utils';
import {RespondToCollaborationRequestEndpoint} from './types';
import {
  internalRespondToCollaborationRequest,
  notifyUserOnCollaborationRequestResponse,
} from './utils';
import {respondToCollaborationRequestJoiSchema} from './validation';

const respondToCollaborationRequest: RespondToCollaborationRequestEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, respondToCollaborationRequestJoiSchema);
  const agent = await context.session.getAgent(context, instData, AppResourceType.User);
  const request = await executeWithMutationRunOptions(context, async opts => {
    return await internalRespondToCollaborationRequest(context, agent, data, opts);
  });
  await notifyUserOnCollaborationRequestResponse(context, request, data.response);
  return {request: collaborationRequestForUserExtractor(request)};
};

export default respondToCollaborationRequest;
