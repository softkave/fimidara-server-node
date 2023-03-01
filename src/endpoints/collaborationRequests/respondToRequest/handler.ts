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
  const user = await context.session.getUser(context, instData);
  const request = await internalRespondToCollaborationRequest(context, user, data);
  return {
    request: collaborationRequestForUserExtractor(request),
  };
};

export default respondToCollaborationRequest;
