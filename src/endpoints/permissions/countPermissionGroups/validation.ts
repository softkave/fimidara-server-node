import Joi from 'joi';
import {getPermissionGroupsBaseJoiSchemaParts} from '../getPermissionGroups/validation.js';
import {CountPermissionGroupsEndpointParams} from './types.js';

export const countPermissionGroupsJoiSchema =
  Joi.object<CountPermissionGroupsEndpointParams>()
    .keys(getPermissionGroupsBaseJoiSchemaParts)
    .required();
