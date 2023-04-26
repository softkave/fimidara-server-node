import * as Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types';
import {validationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import {
  GetEntityAssignedPermissionGroupsEndpointParams,
  GetEntityAssignedPermissionGroupsEndpointParamsBase,
} from './types';

export const getEntityAssignedPermissionGroupsBaseJoiSchemaParts: JoiSchemaParts<GetEntityAssignedPermissionGroupsEndpointParamsBase> =
  {
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    entityId: validationSchemas.resourceId.required(),
    includeInheritedPermissionGroups: Joi.boolean(),
  };

export const getEntityAssignedPermissionGroupsJoiSchema =
  Joi.object<GetEntityAssignedPermissionGroupsEndpointParams>()
    .keys({
      ...getEntityAssignedPermissionGroupsBaseJoiSchemaParts,
    })
    .required();
