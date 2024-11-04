import {startJoiObject} from '../../../utils/validationUtils.js';
import {getCollaboratorsBaseJoiSchemaParts} from '../getCollaborators/validation.js';
import {CountCollaboratorsWithoutPermissionEndpointParams} from './types.js';

export const countCollaboratorsWithoutPermissionJoiSchema =
  startJoiObject<CountCollaboratorsWithoutPermissionEndpointParams>(
    getCollaboratorsBaseJoiSchemaParts
  ).required();
