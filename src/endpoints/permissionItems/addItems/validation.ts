import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import permissionItemValidationSchemas from '../validation.js';
import {AddPermissionItemsEndpointParams} from './types.js';

export const addPermissionItemsJoiSchema =
  Joi.object<AddPermissionItemsEndpointParams>()
    .keys({
      workspaceId: kValidationSchemas.resourceId,
      items: permissionItemValidationSchemas.itemInputList.required(),
    })
    .required();
