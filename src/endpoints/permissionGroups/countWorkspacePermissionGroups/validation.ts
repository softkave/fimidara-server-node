import * as Joi from 'joi';
import {getWorkspacePermissionGroupsBaseJoiSchemaParts} from '../getWorkspacePermissionGroups/validation';
import {ICountWorkspacePermissionGroupsEndpointParams} from './types';

export const countWorkspacePermissionGroupsJoiSchema =
  Joi.object<ICountWorkspacePermissionGroupsEndpointParams>()
    .keys(getWorkspacePermissionGroupsBaseJoiSchemaParts)
    .required();
