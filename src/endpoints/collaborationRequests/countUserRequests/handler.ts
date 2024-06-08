import {kSessionUtils} from '../../contexts/SessionContext.js';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {CountUserCollaborationRequestsEndpoint} from './types.js';

const countUserCollaborationRequests: CountUserCollaborationRequestsEndpoint =
  async reqData => {
    const user = await kUtilsInjectables
      .session()
      .getUser(reqData, kSessionUtils.accessScopes.user);
    const count = await kSemanticModels.collaborationRequest().countByEmail(user.email);
    return {count};
  };

export default countUserCollaborationRequests;
