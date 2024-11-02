import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import {
  UpdatePermissionGroupEndpointParams,
  UpdatePermissionGroupInput,
} from './types.js';

export const updatePermissionGroupJoiSchema =
  Joi.object<UpdatePermissionGroupEndpointParams>()
    .keys({
      permissionGroupId: kValidationSchemas.resourceId.required(),
      data: Joi.object<UpdatePermissionGroupInput>()
        .keys({
          name: kValidationSchemas.name,
          description: kValidationSchemas.description.allow(null),
        })
        .required(),
    })
    .required();
