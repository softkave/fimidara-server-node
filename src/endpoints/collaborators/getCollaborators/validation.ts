import {startJoiObject} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {GetCollaboratorsEndpointParams} from './types.js';

export const getCollaboratorsBaseJoiSchemaParts =
  endpointValidationSchemas.optionalWorkspaceIdParts;

export const getCollaboratorsJoiSchema =
  startJoiObject<GetCollaboratorsEndpointParams>({
    ...endpointValidationSchemas.paginationParts,
    ...getCollaboratorsBaseJoiSchemaParts,
  }).required();
