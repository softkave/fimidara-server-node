import {StrictSchemaMap} from 'joi';
import {startJoiObject} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {
  GetPermissionGroupsEndpointParams,
  GetPermissionGroupsEndpointParamsBase,
} from './types.js';

export const getPermissionGroupsBaseJoiSchemaParts: StrictSchemaMap<GetPermissionGroupsEndpointParamsBase> =
  endpointValidationSchemas.optionalWorkspaceIdParts;

export const getPermissionGroupsJoiSchema =
  startJoiObject<GetPermissionGroupsEndpointParams>({
    ...getPermissionGroupsBaseJoiSchemaParts,
    ...endpointValidationSchemas.paginationParts,
  }).required();
