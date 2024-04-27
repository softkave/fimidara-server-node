import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {collaborationRequestForWorkspaceListExtractor} from '../utils';
import {GetWorkspaceCollaborationRequestsEndpoint} from './types';
import {getWorkspaceCollaborationRequestsQuery} from './utils';
import {getWorkspaceCollaborationRequestsJoiSchema} from './validation';

const getWorkspaceCollaborationRequests: GetWorkspaceCollaborationRequestsEndpoint =
  async instData => {
    const data = validate(instData.data, getWorkspaceCollaborationRequestsJoiSchema);
    const agent = await kUtilsInjectables
      .session()
      .getAgentFromReq(
        instData,
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
