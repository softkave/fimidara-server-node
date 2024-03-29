import * as Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils';
import permissionItemValidationSchemas from '../../permissionItems/validation';
import {endpointValidationSchemas} from '../../validation';
import {UnassignPermissionGroupsEndpointParams} from './types';

export const unassignPermissionGroupsJoiSchema =
  Joi.object<UnassignPermissionGroupsEndpointParams>()
    .keys({
      ...endpointValidationSchemas.optionalWorkspaceIdParts,
      entityId: permissionItemValidationSchemas.entityParts.entityId.required(),
      permissionGroups: kValidationSchemas.resourceIdOrResourceIdList.required(),
    })
    .required();
