import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {validate} from '../../../utils/validate.js';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils.js';
import {getWorkspaceCollaborationRequestsQuery} from '../getWorkspaceRequests/utils.js';
import {CountWorkspaceCollaborationRequestsEndpoint} from './types.js';
import {countWorkspaceCollaborationRequestsJoiSchema} from './validation.js';

const countWorkspaceCollaborationRequests: CountWorkspaceCollaborationRequestsEndpoint =
  async reqData => {
    const data = validate(
      reqData.data,
      countWorkspaceCollaborationRequestsJoiSchema
    );
    const agent = await kUtilsInjectables
      .session()
      .getAgentFromReq(
        reqData,
        kSessionUtils.permittedAgentType.api,
        kSessionUtils.accessScope.api
      );
    const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
    const q = await getWorkspaceCollaborationRequestsQuery(agent, workspace);
    const count = await kSemanticModels
      .collaborationRequest()
      .countManyByWorkspaceAndIdList(q);
    return {count};
  };

export default countWorkspaceCollaborationRequests;
