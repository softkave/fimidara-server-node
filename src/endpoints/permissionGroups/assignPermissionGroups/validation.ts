import * as Joi from 'joi';
import {endpointValidationSchemas} from '../../validation';
import permissionGroupsValidationSchemas from '../validation';
import {IAssignPermissionGroupsEndpointParams} from './types';

export const assignPermissionGroupsJoiSchema = Joi.object<IAssignPermissionGroupsEndpointParams>()
  .keys({
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    permissionGroups: permissionGroupsValidationSchemas.assignedPermissionGroupsList.required(),
  })
  .required();
