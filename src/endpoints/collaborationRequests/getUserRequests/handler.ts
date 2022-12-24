import CollaborationRequestQueries from '../queries';
import {collaborationRequestListExtractor} from '../utils';
import {GetUserCollaborationRequestsEndpoint} from './types';

const getUserCollaborationRequests: GetUserCollaborationRequestsEndpoint = async (context, instData) => {
  const user = await context.session.getUser(context, instData);
  const requests = await context.data.collaborationRequest.getManyItems(
    CollaborationRequestQueries.getByUserEmail(user.email)
  );

  return {
    requests: collaborationRequestListExtractor(requests),
  };
};

export default getUserCollaborationRequests;
