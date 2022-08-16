import {validate} from '../../../utilities/validate';
import {collaborationRequestExtractor} from '../utils';
import {RespondToRequestEndpoint} from './types';
import {internalRespondToRequest} from './utils';
import {respondToRequestJoiSchema} from './validation';

const respondToRequest: RespondToRequestEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, respondToRequestJoiSchema);
  const user = await context.session.getUser(context, instData);
  const request = await internalRespondToRequest(context, user, data);
  return {
    request: collaborationRequestExtractor(request),
  };
};

export default respondToRequest;
