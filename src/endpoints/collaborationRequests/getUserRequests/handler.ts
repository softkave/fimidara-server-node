import {validate} from '../../../utils/validate';
import {getEndpointPageFromInput} from '../../utils';
import CollaborationRequestQueries from '../queries';
import {collaborationRequestListExtractor} from '../utils';
import {GetUserCollaborationRequestsEndpoint} from './types';
import {getUserRequestsJoiSchema} from './validation';

const getUserCollaborationRequests: GetUserCollaborationRequestsEndpoint = async (context, d) => {
  const data = validate(d.data, getUserRequestsJoiSchema);
  const user = await context.session.getUser(context, d);
  const requests = await context.data.collaborationRequest.getManyByQuery(
    CollaborationRequestQueries.getByUserEmail(user.email),
    data
  );
  return {page: getEndpointPageFromInput(data), requests: collaborationRequestListExtractor(requests)};
};

export default getUserCollaborationRequests;
