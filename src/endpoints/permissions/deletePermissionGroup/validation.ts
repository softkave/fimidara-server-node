import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {DeletePermissionGroupEndpointParams} from './types.js';

export const deletePermissionGroupJoiSchema =
  startJoiObject<DeletePermissionGroupEndpointParams>({
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    permissionGroupId: kValidationSchemas.resourceId,
    name: kValidationSchemas.name,
  }).required();
