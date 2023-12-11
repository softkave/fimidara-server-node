import {kSemanticModels, kUtilsInjectables} from '../../contexts/injectables';
import {CountUserCollaborationRequestsEndpoint} from './types';

const countUserCollaborationRequests: CountUserCollaborationRequestsEndpoint =
  async d => {
    const user = await kUtilsInjectables.session().getUser(d);
    const count = await kSemanticModels.collaborationRequest().countByEmail(user.email);
    return {count};
  };

export default countUserCollaborationRequests;
