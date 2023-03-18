import {AppResourceType} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {MemStore} from '../../contexts/mem/Mem';
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
  const request = await MemStore.withTransaction(context, async transaction => {
    return await internalRespondToCollaborationRequest(context, agent, data, {transaction});
  });
  await notifyUserOnCollaborationRequestResponse(context, request, data.response);
  return {request: collaborationRequestForUserExtractor(request)};
};

export default respondToCollaborationRequest;
