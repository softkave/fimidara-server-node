import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {
  UpdatePermissionGroupEndpointParams,
  UpdatePermissionGroupInput,
} from './types.js';

export const updatePermissionGroupJoiSchema =
  startJoiObject<UpdatePermissionGroupEndpointParams>({
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    name: kValidationSchemas.name,
    permissionGroupId: kValidationSchemas.resourceId,
    data: startJoiObject<UpdatePermissionGroupInput>({
      name: kValidationSchemas.name,
      description: kValidationSchemas.description.allow(null),
    }).required(),
  }).required();
