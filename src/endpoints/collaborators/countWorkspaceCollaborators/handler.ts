import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils.js';
import {getWorkspaceCollaboratorsQuery} from '../getWorkspaceCollaborators/utils.js';
import {CountWorkspaceCollaboratorsEndpoint} from './types.js';
import {countWorkspaceCollaboratorsJoiSchema} from './validation.js';

const countWorkspaceCollaborators: CountWorkspaceCollaboratorsEndpoint =
  async instData => {
    const data = validate(instData.data, countWorkspaceCollaboratorsJoiSchema);
    const agent = await kUtilsInjectables
      .session()
      .getAgentFromReq(
        instData,
        kSessionUtils.permittedAgentTypes.api,
        kSessionUtils.accessScopes.api
      );
    const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
    const assignedItemsQuery = await getWorkspaceCollaboratorsQuery(agent, workspace);
    const count = await kSemanticModels.assignedItem().countByQuery(assignedItemsQuery);
    return {count};
  };

export default countWorkspaceCollaborators;
