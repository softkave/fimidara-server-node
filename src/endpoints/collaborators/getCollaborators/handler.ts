import {validate} from '../../../utils/validate.js';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {collaboratorListExtractor} from '../utils.js';
import {GetCollaboratorsEndpoint} from './types.js';
import {getCollaboratorsQuery} from './utils.js';
import {getCollaboratorsJoiSchema} from './validation.js';

const getCollaboratorsEndpoint: GetCollaboratorsEndpoint = async reqData => {
  const data = validate(reqData.data, getCollaboratorsJoiSchema);
  const {agent, workspaceId} = await initEndpoint(reqData, {data});

  const q = await getCollaboratorsQuery(agent, workspaceId);
  applyDefaultEndpointPaginationOptions(data);
  // TODO
  const collaborators = [];

  return {
    page: getEndpointPageFromInput(data),
    collaborators: collaboratorListExtractor(collaborators),
  };
};

export default getCollaboratorsEndpoint;
