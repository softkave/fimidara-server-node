import * as Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types';
import {endpointValidationSchemas} from '../../validation';
import {
  GetWorkspacePermissionGroupsEndpointParams,
  GetWorkspacePermissionGroupsEndpointParamsBase,
} from './types';

export const getWorkspacePermissionGroupsBaseJoiSchemaParts: JoiSchemaParts<GetWorkspacePermissionGroupsEndpointParamsBase> =
  endpointValidationSchemas.optionalWorkspaceIdParts;

export const getWorkspacePermissionGroupsJoiSchema =
  Joi.object<GetWorkspacePermissionGroupsEndpointParams>()
    .keys({
      ...getWorkspacePermissionGroupsBaseJoiSchemaParts,
      ...endpointValidationSchemas.paginationParts,
    })
    .required();
