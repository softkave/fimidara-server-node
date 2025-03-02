import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {validate} from '../../../utils/validate.js';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination.js';
import {collaborationRequestForUserListExtractor} from '../utils.js';
import {GetUserCollaborationRequestsEndpoint} from './types.js';
import {getUserRequestsJoiSchema} from './validation.js';

const getUserCollaborationRequests: GetUserCollaborationRequestsEndpoint =
  async reqData => {
    const data = validate(reqData.data, getUserRequestsJoiSchema);
    const user = await kIjxUtils
      .session()
      .getUser(reqData, kSessionUtils.accessScopes.user);
    applyDefaultEndpointPaginationOptions(data);
    const requests = await kIjxSemantic
      .collaborationRequest()
      .getManyByEmail(user.email, data);
    return {
      page: getEndpointPageFromInput(data),
      requests: collaborationRequestForUserListExtractor(requests),
    };
  };

export default getUserCollaborationRequests;
