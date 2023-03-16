import {validate} from '../../../utils/validate';
import {applyDefaultEndpointPaginationOptions, getEndpointPageFromInput} from '../../utils';
import {collaborationRequestForUserListExtractor} from '../utils';
import {GetUserCollaborationRequestsEndpoint} from './types';
import {getUserRequestsJoiSchema} from './validation';

const getUserCollaborationRequests: GetUserCollaborationRequestsEndpoint = async (context, d) => {
  const data = validate(d.data, getUserRequestsJoiSchema);
  const user = await context.session.getUser(context, d);
  applyDefaultEndpointPaginationOptions(data);
  const requests = await context.semantic.collaborationRequest.getManyByEmail(user.email, data);
  return {
    page: getEndpointPageFromInput(data),
    requests: collaborationRequestForUserListExtractor(requests),
  };
};

export default getUserCollaborationRequests;
