import Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types.js';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {
  GetAssignedPermissionGroupsEndpointParams,
  GetAssignedPermissionGroupsEndpointParamsBase,
} from './types.js';

export const getAssignedPermissionGroupsBaseJoiSchemaParts: JoiSchemaParts<GetAssignedPermissionGroupsEndpointParamsBase> =
  {
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    entityId: kValidationSchemas.resourceId.required(),
    includeInheritedPermissionGroups: Joi.boolean(),
  };

export const getAssignedPermissionGroupsJoiSchema =
  Joi.object<GetAssignedPermissionGroupsEndpointParams>()
    .keys({
      ...getAssignedPermissionGroupsBaseJoiSchemaParts,
    })
    .required();
