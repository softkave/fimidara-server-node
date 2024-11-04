import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {GetCollaborationRequestEndpointParams} from './types.js';

export const getCollaborationRequestJoiSchema =
  startJoiObject<GetCollaborationRequestEndpointParams>({
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    requestId: kValidationSchemas.resourceId.required(),
  }).required();
