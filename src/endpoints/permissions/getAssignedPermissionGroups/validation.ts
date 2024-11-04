import Joi, {StrictSchemaMap} from 'joi';
import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {
  GetAssignedPermissionGroupsEndpointParams,
  GetAssignedPermissionGroupsEndpointParamsBase,
} from './types.js';

export const getAssignedPermissionGroupsBaseJoiSchemaParts: StrictSchemaMap<GetAssignedPermissionGroupsEndpointParamsBase> =
  {
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    entityId: kValidationSchemas.resourceId.required(),
    includeInheritedPermissionGroups: Joi.boolean(),
  };

export const getAssignedPermissionGroupsJoiSchema =
  startJoiObject<GetAssignedPermissionGroupsEndpointParams>({
    ...getAssignedPermissionGroupsBaseJoiSchemaParts,
  }).required();
