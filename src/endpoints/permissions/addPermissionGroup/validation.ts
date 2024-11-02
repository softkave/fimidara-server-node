import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import {AddPermissionGroupEndpointParams} from './types.js';

export const addPermissionGroupJoiSchema =
  Joi.object<AddPermissionGroupEndpointParams>()
    .keys({
      workspaceId: kValidationSchemas.resourceId,
      name: kValidationSchemas.name.required(),
      description: kValidationSchemas.description.allow(null),
    })
    .required();
