import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {getCollaborationRequestsQuery} from '../getRequests/utils.js';
import {CountCollaborationRequestsEndpoint} from './types.js';
import {countCollaborationRequestsJoiSchema} from './validation.js';

const countCollaborationRequestsEndpoint: CountCollaborationRequestsEndpoint =
  async reqData => {
    const data = validate(reqData.data, countCollaborationRequestsJoiSchema);
    const {agent, workspace} = await initEndpoint(reqData, {data});

    const q = await getCollaborationRequestsQuery(agent, workspace);
    const count = await kSemanticModels
      .collaborationRequest()
      .countManyByWorkspaceAndIdList(q);

    return {count};
  };

export default countCollaborationRequestsEndpoint;
