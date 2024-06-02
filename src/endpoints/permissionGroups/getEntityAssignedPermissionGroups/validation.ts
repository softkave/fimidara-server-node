import Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types.js';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {
  GetEntityAssignedPermissionGroupsEndpointParams,
  GetEntityAssignedPermissionGroupsEndpointParamsBase,
} from './types.js';

export const getEntityAssignedPermissionGroupsBaseJoiSchemaParts: JoiSchemaParts<GetEntityAssignedPermissionGroupsEndpointParamsBase> =
  {
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    entityId: kValidationSchemas.resourceId.required(),
    includeInheritedPermissionGroups: Joi.boolean(),
  };

export const getEntityAssignedPermissionGroupsJoiSchema =
  Joi.object<GetEntityAssignedPermissionGroupsEndpointParams>()
    .keys({
      ...getEntityAssignedPermissionGroupsBaseJoiSchemaParts,
    })
    .required();
