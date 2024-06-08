import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils.js';
import {getWorkspaceCollaborationRequestsQuery} from '../getWorkspaceRequests/utils.js';
import {CountWorkspaceCollaborationRequestsEndpoint} from './types.js';
import {countWorkspaceCollaborationRequestsJoiSchema} from './validation.js';

const countWorkspaceCollaborationRequests: CountWorkspaceCollaborationRequestsEndpoint =
  async instData => {
    const data = validate(instData.data, countWorkspaceCollaborationRequestsJoiSchema);
    const agent = await kUtilsInjectables
      .session()
      .getAgentFromReq(
        instData,
        kSessionUtils.permittedAgentTypes.api,
        kSessionUtils.accessScopes.api
      );
    const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
    const q = await getWorkspaceCollaborationRequestsQuery(agent, workspace);
    const count = await kSemanticModels
      .collaborationRequest()
      .countManyByWorkspaceAndIdList(q);
    return {count};
  };

export default countWorkspaceCollaborationRequests;
