import {CountUserCollaborationRequestsEndpoint} from './types';

const countUserCollaborationRequests: CountUserCollaborationRequestsEndpoint = async (
  context,
  d
) => {
  const user = await context.session.getUser(context, d);
  const count = await context.semantic.collaborationRequest.countByEmail(user.email);
  return {count};
};

export default countUserCollaborationRequests;
