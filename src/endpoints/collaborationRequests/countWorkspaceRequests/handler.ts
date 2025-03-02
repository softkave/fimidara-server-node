import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
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
    const agent = await kIjxUtils
      .session()
      .getAgentFromReq(
        reqData,
        kSessionUtils.permittedAgentTypes.api,
        kSessionUtils.accessScopes.api
      );
    const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
    const q = await getWorkspaceCollaborationRequestsQuery(agent, workspace);
    const count = await kIjxSemantic
      .collaborationRequest()
      .countManyByWorkspaceAndIdList(q);
    return {count};
  };

export default countWorkspaceCollaborationRequests;
