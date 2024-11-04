import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {validate} from '../../../utils/validate.js';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils.js';
import {getWorkspaceCollaboratorsQuery} from '../getCollaborators/utils.js';
import {CountCollaboratorsEndpoint} from './types.js';
import {countCollaboratorsJoiSchema} from './validation.js';

const countCollaborators: CountCollaboratorsEndpoint = async reqData => {
  const data = validate(reqData.data, countCollaboratorsJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentType.api,
      kSessionUtils.accessScope.api
    );
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
  const assignedItemsQuery = await getWorkspaceCollaboratorsQuery(
    agent,
    workspace
  );
  const count = await kSemanticModels
    .assignedItem()
    .countByQuery(assignedItemsQuery);
  return {count};
};

export default countCollaborators;
