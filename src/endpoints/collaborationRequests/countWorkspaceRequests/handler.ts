import {validate} from '../../../utils/validate';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {getWorkspaceCollaborationRequestsQuery} from '../getWorkspaceRequests/utils';
import {CountWorkspaceCollaborationRequestsEndpoint} from './types';
import {countWorkspaceCollaborationRequestsJoiSchema} from './validation';

const countWorkspaceCollaborationRequests: CountWorkspaceCollaborationRequestsEndpoint =
  async instData => {
    const data = validate(instData.data, countWorkspaceCollaborationRequestsJoiSchema);
    const agent = await kUtilsInjectables.session().getAgent(instData);
    const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
    const q = await getWorkspaceCollaborationRequestsQuery(agent, workspace);
    const count = await kSemanticModels
      .collaborationRequest()
      .countManyByWorkspaceAndIdList(q);
    return {count};
  };

export default countWorkspaceCollaborationRequests;
