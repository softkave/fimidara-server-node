import * as Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils';
import permissionItemValidationSchemas from '../validation';
import {AddPermissionItemsEndpointParams} from './types';

export const addPermissionItemsJoiSchema = Joi.object<AddPermissionItemsEndpointParams>()
  .keys({
    workspaceId: kValidationSchemas.resourceId,
    items: permissionItemValidationSchemas.itemInputList.required(),
  })
  .required();
