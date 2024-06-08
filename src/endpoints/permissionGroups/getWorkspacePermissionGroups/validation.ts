import Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types.js';
import {endpointValidationSchemas} from '../../validation.js';
import {
  GetWorkspacePermissionGroupsEndpointParams,
  GetWorkspacePermissionGroupsEndpointParamsBase,
} from './types.js';

export const getWorkspacePermissionGroupsBaseJoiSchemaParts: JoiSchemaParts<GetWorkspacePermissionGroupsEndpointParamsBase> =
  endpointValidationSchemas.optionalWorkspaceIdParts;

export const getWorkspacePermissionGroupsJoiSchema =
  Joi.object<GetWorkspacePermissionGroupsEndpointParams>()
    .keys({
      ...getWorkspacePermissionGroupsBaseJoiSchemaParts,
      ...endpointValidationSchemas.paginationParts,
    })
    .required();
