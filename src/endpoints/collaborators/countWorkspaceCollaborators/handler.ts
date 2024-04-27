import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {getWorkspaceCollaboratorsQuery} from '../getWorkspaceCollaborators/utils';
import {CountWorkspaceCollaboratorsEndpoint} from './types';
import {countWorkspaceCollaboratorsJoiSchema} from './validation';

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
