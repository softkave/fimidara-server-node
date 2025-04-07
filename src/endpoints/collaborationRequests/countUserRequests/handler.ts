import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {CountUserCollaborationRequestsEndpoint} from './types.js';

const countUserCollaborationRequests: CountUserCollaborationRequestsEndpoint =
  async reqData => {
    const user = await kIjxUtils
      .session()
      .getUser(reqData, kSessionUtils.accessScopes.user);
    const count = await kIjxSemantic
      .collaborationRequest()
      .countByEmail(user.email);
    return {count};
  };

export default countUserCollaborationRequests;
