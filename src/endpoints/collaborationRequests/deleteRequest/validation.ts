import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {DeleteCollaborationRequestEndpointParams} from './types.js';

export const deleteCollaborationRequestJoiSchema =
  startJoiObject<DeleteCollaborationRequestEndpointParams>({
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    requestId: kValidationSchemas.resourceId.required(),
  }).required();
