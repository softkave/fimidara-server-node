import CollaborationRequestQueries from '../queries';
import {collabRequestListExtractor} from '../utils';
import {GetUserRequestsEndpoint} from './types';

/**
 * getUserRequests.
 * Fetches a user's collaboration requests.
 *
 * Ensure that:
 * - Check that user exists
 * - Fetch and return the user's requests
 */

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
