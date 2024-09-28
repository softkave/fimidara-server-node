import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {validate} from '../../../utils/validate.js';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination.js';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils.js';
import {collaborationRequestForWorkspaceListExtractor} from '../utils.js';
import {GetWorkspaceCollaborationRequestsEndpoint} from './types.js';
import {getWorkspaceCollaborationRequestsQuery} from './utils.js';
import {getWorkspaceCollaborationRequestsJoiSchema} from './validation.js';

const getWorkspaceCollaborationRequests: GetWorkspaceCollaborationRequestsEndpoint =
  async reqData => {
    const data = validate(
      reqData.data,
      getWorkspaceCollaborationRequestsJoiSchema
    );
    const agent = await kUtilsInjectables
      .session()
      .getAgentFromReq(
        reqData,
        kSessionUtils.permittedAgentTypes.api,
        kSessionUtils.accessScopes.api
      );
    const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
    const q = await getWorkspaceCollaborationRequestsQuery(agent, workspace);
    applyDefaultEndpointPaginationOptions(data);
    const requests = await kSemanticModels
      .collaborationRequest()
      .getManyByWorkspaceAndIdList(q, data);
    return {
      page: getEndpointPageFromInput(data),
      requests: collaborationRequestForWorkspaceListExtractor(requests),
    };
  };

export default getWorkspaceCollaborationRequests;
