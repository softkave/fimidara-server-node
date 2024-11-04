import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {RevokeCollaborationRequestEndpointParams} from './types.js';

export const revokeCollaborationRequestJoiSchema =
  startJoiObject<RevokeCollaborationRequestEndpointParams>({
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    requestId: kValidationSchemas.resourceId.required(),
  }).required();
