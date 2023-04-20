import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import tagValidationSchemas from '../../tags/validation';
import permissionGroupsValidationSchemas from '../validation';
import {UpdatePermissionGroupEndpointParams} from './types';

export const updatePermissionGroupJoiSchema = Joi.object<UpdatePermissionGroupEndpointParams>()
  .keys({
    permissionGroupId: validationSchemas.resourceId.required(),
    data: Joi.object()
      .keys({
        name: validationSchemas.name,
        description: validationSchemas.description.allow(null),
        permissionGroups:
          permissionGroupsValidationSchemas.assignedPermissionGroupsList.allow(null),
        tags: tagValidationSchemas.assignedTagsList.allow(null),
      })
      .required(),
  })
  .required();
