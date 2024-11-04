import {startJoiObject} from '../../../utils/validationUtils.js';
import {getCollaboratorsBaseJoiSchemaParts} from '../getCollaborators/validation.js';
import {CountCollaboratorsEndpointParams} from './types.js';

export const countCollaboratorsJoiSchema =
  startJoiObject<CountCollaboratorsEndpointParams>(
    getCollaboratorsBaseJoiSchemaParts
  ).required();
