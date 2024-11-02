import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import permissionItemValidationSchemas from '../../permissions/validation.js';
import {endpointValidationSchemas} from '../../validation.js';
import {UnassignPermissionGroupsEndpointParams} from './types.js';

export const unassignPermissionGroupsJoiSchema =
  Joi.object<UnassignPermissionGroupsEndpointParams>()
    .keys({
      ...endpointValidationSchemas.optionalWorkspaceIdParts,
      entityId: permissionItemValidationSchemas.entityParts.entityId.required(),
      permissionGroupId:
        kValidationSchemas.resourceIdOrResourceIdList.required(),
    })
    .required();
