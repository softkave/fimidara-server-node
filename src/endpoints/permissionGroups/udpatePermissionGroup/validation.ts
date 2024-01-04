import * as Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils';
import {UpdatePermissionGroupEndpointParams, UpdatePermissionGroupInput} from './types';

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
