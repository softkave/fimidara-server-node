import Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types.js';
import {endpointValidationSchemas} from '../../validation.js';
import {
  GetPermissionGroupsEndpointParams,
  GetPermissionGroupsEndpointParamsBase,
} from './types.js';

export const getPermissionGroupsBaseJoiSchemaParts: JoiSchemaParts<GetPermissionGroupsEndpointParamsBase> =
  endpointValidationSchemas.optionalWorkspaceIdParts;

export const getPermissionGroupsJoiSchema =
  Joi.object<GetPermissionGroupsEndpointParams>()
    .keys({
      ...getPermissionGroupsBaseJoiSchemaParts,
      ...endpointValidationSchemas.paginationParts,
    })
    .required();
