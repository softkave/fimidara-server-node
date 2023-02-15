import * as Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types';
import {endpointValidationSchemas} from '../../validation';
import {
  IGetWorkspacePermissionGroupsEndpointParams,
  IGetWorkspacePermissionGroupsEndpointParamsBase,
} from './types';

export const getWorkspacePermissionGroupsBaseJoiSchemaParts: JoiSchemaParts<IGetWorkspacePermissionGroupsEndpointParamsBase> =
  endpointValidationSchemas.optionalWorkspaceIdParts;

export const getWorkspacePermissionGroupsJoiSchema =
  Joi.object<IGetWorkspacePermissionGroupsEndpointParams>()
    .keys({
      ...getWorkspacePermissionGroupsBaseJoiSchemaParts,
      ...endpointValidationSchemas.paginationParts,
    })
    .required();
