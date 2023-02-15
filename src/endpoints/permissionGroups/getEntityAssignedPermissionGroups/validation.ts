import * as Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types';
import {endpointValidationSchemas} from '../../validation';
import {
  IGetEntityAssignedPermissionGroupsEndpointParams,
  IGetEntityAssignedPermissionGroupsEndpointParamsBase,
} from './types';

export const getEntityAssignedPermissionGroupsBaseJoiSchemaParts: JoiSchemaParts<IGetEntityAssignedPermissionGroupsEndpointParamsBase> =
  endpointValidationSchemas.optionalWorkspaceIdParts;

export const getEntityAssignedPermissionGroupsJoiSchema =
  Joi.object<IGetEntityAssignedPermissionGroupsEndpointParams>()
    .keys({
      ...getEntityAssignedPermissionGroupsBaseJoiSchemaParts,
      ...endpointValidationSchemas.paginationParts,
    })
    .required();
