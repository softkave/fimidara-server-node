import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {GetPermissionGroupEndpointParams} from './types.js';

export const getPermissionGroupJoiSchema =
  startJoiObject<GetPermissionGroupEndpointParams>({
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    permissionGroupId: kValidationSchemas.resourceId,
    name: kValidationSchemas.name,
  }).required();
