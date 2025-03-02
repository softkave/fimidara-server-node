import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxSemantic, kIkxUtils} from '../../../contexts/ijx/injectables.js';
import {validate} from '../../../utils/validate.js';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils.js';
import {getWorkspaceCollaboratorsQuery} from '../getWorkspaceCollaborators/utils.js';
import {CountWorkspaceCollaboratorsEndpoint} from './types.js';
import {countWorkspaceCollaboratorsJoiSchema} from './validation.js';

const countWorkspaceCollaborators: CountWorkspaceCollaboratorsEndpoint =
  async reqData => {
    const data = validate(reqData.data, countWorkspaceCollaboratorsJoiSchema);
    const agent = await kIkxUtils
      .session()
      .getAgentFromReq(
        reqData,
        kSessionUtils.permittedAgentTypes.api,
        kSessionUtils.accessScopes.api
      );
    const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
    const assignedItemsQuery = await getWorkspaceCollaboratorsQuery(
      agent,
      workspace
    );
    const count = await kIjxSemantic
      .assignedItem()
      .countByQuery(assignedItemsQuery);
    return {count};
  };

export default countWorkspaceCollaborators;
