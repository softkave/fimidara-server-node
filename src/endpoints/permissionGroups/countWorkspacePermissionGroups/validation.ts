import * as Joi from 'joi';
import {getWorkspacePermissionGroupsBaseJoiSchemaParts} from '../getWorkspacePermissionGroups/validation';
import {CountWorkspacePermissionGroupsEndpointParams} from './types';

export const countWorkspacePermissionGroupsJoiSchema =
  Joi.object<CountWorkspacePermissionGroupsEndpointParams>()
    .keys(getWorkspacePermissionGroupsBaseJoiSchemaParts)
    .required();
