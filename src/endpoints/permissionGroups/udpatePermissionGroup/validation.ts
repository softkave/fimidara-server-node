import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import {UpdatePermissionGroupEndpointParams, UpdatePermissionGroupInput} from './types';

export const updatePermissionGroupJoiSchema = Joi.object<UpdatePermissionGroupEndpointParams>()
  .keys({
    permissionGroupId: validationSchemas.resourceId.required(),
    data: Joi.object<UpdatePermissionGroupInput>()
      .keys({
        name: validationSchemas.name,
        description: validationSchemas.description.allow(null),
      })
      .required(),
  })
  .required();
