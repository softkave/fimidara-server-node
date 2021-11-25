import CollaborationRequestQueries from '../queries';
import {collabRequestListExtractor} from '../utils';
import {GetUserRequestsEndpoint} from './types';

const getUserRequests: GetUserRequestsEndpoint = async (context, instData) => {
  const user = await context.session.getUser(context, instData);
  const requests = await context.data.collaborationRequest.getManyItems(
    CollaborationRequestQueries.getByUserEmail(user.email)
  );

  return {
    requests: collabRequestListExtractor(requests),
  };
};

export default getUserRequests;
