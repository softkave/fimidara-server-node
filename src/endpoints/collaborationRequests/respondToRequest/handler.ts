import {AppResourceType} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {collaborationRequestForUserExtractor} from '../utils';
import {RespondToCollaborationRequestEndpoint} from './types';
import {internalRespondToCollaborationRequest} from './utils';
import {respondToCollaborationRequestJoiSchema} from './validation';

const respondToCollaborationRequest: RespondToCollaborationRequestEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, respondToCollaborationRequestJoiSchema);
  const agent = await context.session.getAgent(context, instData, AppResourceType.User);
  const request = await internalRespondToCollaborationRequest(context, agent, data);
  return {
    request: collaborationRequestForUserExtractor(request),
  };
};

export default respondToCollaborationRequest;
