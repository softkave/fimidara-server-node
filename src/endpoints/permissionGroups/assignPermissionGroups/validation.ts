import * as Joi from 'joi';
import permissionItemValidationSchemas from '../../permissionItems/validation';
import {endpointValidationSchemas} from '../../validation';
import permissionGroupsValidationSchemas from '../validation';
import {IAssignPermissionGroupsEndpointParams} from './types';

export const assignPermissionGroupsJoiSchema = Joi.object<IAssignPermissionGroupsEndpointParams>()
  .keys({
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    entityId: permissionItemValidationSchemas.entityParts.entityId.required(),
    permissionGroups: permissionGroupsValidationSchemas.assignedPermissionGroupsList.required(),
  })
  .required();
