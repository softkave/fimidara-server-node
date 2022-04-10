import assert = require('assert');
import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {NotFoundError} from '../../errors';
import EndpointReusableQueries from '../../queries';
import {
  checkCollaborationRequestAuthorization,
  collabRequestExtractor,
} from '../utils';
import {GetRequestEndpoint} from './types';
import {getRequestJoiSchema} from './validation';

const getRequest: GetRequestEndpoint = async (context, instData) => {
  const data = validate(instData.data, getRequestJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const request = await context.data.collaborationRequest.getItem(
    EndpointReusableQueries.getById(data.requestId)
  );

  assert(request, new NotFoundError('Collaboration request not found'));

  if (request.recipientEmail === agent.user?.email) {
    // Request sent to user
    return {request: collabRequestExtractor(request)};
  }

  await checkCollaborationRequestAuthorization(
    context,
    agent,
    request,
    BasicCRUDActions.Read
  );

  return {request: collabRequestExtractor(request)};
};

export default getRequest;
