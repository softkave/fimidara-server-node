import * as Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types';
import {validationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import {
  IGetEntityAssignedPermissionGroupsEndpointParams,
  IGetEntityAssignedPermissionGroupsEndpointParamsBase,
} from './types';

export const getEntityAssignedPermissionGroupsBaseJoiSchemaParts: JoiSchemaParts<IGetEntityAssignedPermissionGroupsEndpointParamsBase> =
  {
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    entityId: validationSchemas.resourceId.required(),
    includeInheritedPermissionGroups: Joi.boolean(),
  };

export const getEntityAssignedPermissionGroupsJoiSchema =
  Joi.object<IGetEntityAssignedPermissionGroupsEndpointParams>()
    .keys({
      ...getEntityAssignedPermissionGroupsBaseJoiSchemaParts,
    })
    .required();
