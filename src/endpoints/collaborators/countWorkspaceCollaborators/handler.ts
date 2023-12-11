import {validate} from '../../../utils/validate';
import {kUtilsInjectables, kSemanticModels} from '../../contexts/injectables';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {getWorkspaceCollaboratorsQuery} from '../getWorkspaceCollaborators/utils';
import {CountWorkspaceCollaboratorsEndpoint} from './types';
import {countWorkspaceCollaboratorsJoiSchema} from './validation';

const countWorkspaceCollaborators: CountWorkspaceCollaboratorsEndpoint =
  async instData => {
    const data = validate(instData.data, countWorkspaceCollaboratorsJoiSchema);
    const agent = await kUtilsInjectables.session().getAgent(instData);
    const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
    const assignedItemsQuery = await getWorkspaceCollaboratorsQuery(agent, workspace);
    const count = await kSemanticModels.assignedItem().countByQuery(assignedItemsQuery);
    return {count};
  };

export default countWorkspaceCollaborators;
