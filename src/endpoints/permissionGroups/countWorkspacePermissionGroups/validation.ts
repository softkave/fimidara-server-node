import Joi from 'joi';
import {getWorkspacePermissionGroupsBaseJoiSchemaParts} from '../getWorkspacePermissionGroups/validation.js';
import {CountWorkspacePermissionGroupsEndpointParams} from './types.js';

export const countWorkspacePermissionGroupsJoiSchema =
  Joi.object<CountWorkspacePermissionGroupsEndpointParams>()
    .keys(getWorkspacePermissionGroupsBaseJoiSchemaParts)
    .required();
