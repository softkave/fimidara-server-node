import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {getCollaboratorsQuery} from '../getCollaborators/utils.js';
import {CountCollaboratorsEndpoint} from './types.js';
import {countCollaboratorsJoiSchema} from './validation.js';

const countCollaboratorsEndpoint: CountCollaboratorsEndpoint =
  async reqData => {
    const data = validate(reqData.data, countCollaboratorsJoiSchema);
    const {agent, workspaceId} = await initEndpoint(reqData, {data});

    const assignedItemsQuery = await getCollaboratorsQuery(agent, workspaceId);
    const count = await kSemanticModels
      .assignedItem()
      .countByQuery(assignedItemsQuery);

    return {count};
  };

export default countCollaboratorsEndpoint;
