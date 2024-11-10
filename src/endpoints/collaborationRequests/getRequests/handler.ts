import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {validate} from '../../../utils/validate.js';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {collaborationRequestForWorkspaceListExtractor} from '../utils.js';
import {GetCollaborationRequestsEndpoint} from './types.js';
import {getCollaborationRequestsQuery} from './utils.js';
import {getCollaborationRequestsJoiSchema} from './validation.js';

const getCollaborationRequestsEndpoint: GetCollaborationRequestsEndpoint =
  async reqData => {
    const data = validate(reqData.data, getCollaborationRequestsJoiSchema);
    const {agent, workspaceId} = await initEndpoint(reqData, {data});

    const q = await getCollaborationRequestsQuery(agent, workspaceId);
    applyDefaultEndpointPaginationOptions(data);
    const requests = await kSemanticModels
      .collaborationRequest()
      .getManyByWorkspaceAndIdList(q, data);

    return {
      page: getEndpointPageFromInput(data),
      requests: collaborationRequestForWorkspaceListExtractor(requests),
    };
  };

export default getCollaborationRequestsEndpoint;
