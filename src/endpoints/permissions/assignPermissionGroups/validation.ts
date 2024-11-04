import {startJoiObject} from '../../../utils/validationUtils.js';
import {
  permissionGroupsValidationSchemas,
  permissionItemValidationSchemas,
} from '../../permissions/validation.js';
import {endpointValidationSchemas} from '../../validation.js';
import {AssignPermissionGroupsEndpointParams} from './types.js';

export const assignPermissionGroupsJoiSchema =
  startJoiObject<AssignPermissionGroupsEndpointParams>({
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    entityId: permissionItemValidationSchemas.entityParts.entityId.required(),
    permissionGroupId: permissionGroupsValidationSchemas.pgIdOrList.required(),
  }).required();
