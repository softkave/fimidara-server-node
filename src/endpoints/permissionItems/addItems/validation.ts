import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import permissionItemValidationSchemas from '../validation';

export const addPermissionItemsJoiSchema = Joi.object()
  .keys({
    workspaceId: validationSchemas.resourceId,
    items: permissionItemValidationSchemas.itemInputList.required(),
  })
  .required();
