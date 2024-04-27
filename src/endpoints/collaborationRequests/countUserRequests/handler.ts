import {kSessionUtils} from '../../contexts/SessionContext';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {CountUserCollaborationRequestsEndpoint} from './types';

const countUserCollaborationRequests: CountUserCollaborationRequestsEndpoint =
  async reqData => {
    const user = await kUtilsInjectables
      .session()
      .getUser(reqData, kSessionUtils.accessScopes.user);
    const count = await kSemanticModels.collaborationRequest().countByEmail(user.email);
    return {count};
  };

export default countUserCollaborationRequests;
