import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination';
import {collaborationRequestForUserListExtractor} from '../utils';
import {GetUserCollaborationRequestsEndpoint} from './types';
import {getUserRequestsJoiSchema} from './validation';

const getUserCollaborationRequests: GetUserCollaborationRequestsEndpoint =
  async reqData => {
    const data = validate(reqData.data, getUserRequestsJoiSchema);
    const user = await kUtilsInjectables
      .session()
      .getUser(reqData, kSessionUtils.accessScopes.user);
    applyDefaultEndpointPaginationOptions(data);
    const requests = await kSemanticModels
      .collaborationRequest()
      .getManyByEmail(user.email, data);
    return {
      page: getEndpointPageFromInput(data),
      requests: collaborationRequestForUserListExtractor(requests),
    };
  };

export default getUserCollaborationRequests;
