import {validate} from '../../../utils/validate';
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
  async (context, instData) => {
    const data = validate(instData.data, getWorkspaceCollaborationRequestsJoiSchema);
    const agent = await context.session.getAgent(context, instData);
    const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
    const q = await getWorkspaceCollaborationRequestsQuery(context, agent, workspace);
    applyDefaultEndpointPaginationOptions(data);
    const requests =
      await context.semantic.collaborationRequest.getManyByWorkspaceAndIdList(q, data);
    return {
      page: getEndpointPageFromInput(data),
      requests: collaborationRequestForWorkspaceListExtractor(requests),
    };
  };

export default getWorkspaceCollaborationRequests;
