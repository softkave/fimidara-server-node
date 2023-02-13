import CollaborationRequestQueries from '../queries';
import {CountUserCollaborationRequestsEndpoint} from './types';

const countUserCollaborationRequests: CountUserCollaborationRequestsEndpoint = async (context, d) => {
  const user = await context.session.getUser(context, d);
  const count = await context.data.collaborationRequest.countByQuery(
    CollaborationRequestQueries.getByUserEmail(user.email)
  );
  return {count};
};

export default countUserCollaborationRequests;
