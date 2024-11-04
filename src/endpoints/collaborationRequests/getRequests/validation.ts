import {startJoiObject} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {GetCollaborationRequestsEndpointParams} from './types.js';

export const getCollaborationRequestsBaseJoiSchemaParts =
  endpointValidationSchemas.optionalWorkspaceIdParts;

export const getCollaborationRequestsJoiSchema =
  startJoiObject<GetCollaborationRequestsEndpointParams>({
    ...getCollaborationRequestsBaseJoiSchemaParts,
    ...endpointValidationSchemas.paginationParts,
  }).required();
