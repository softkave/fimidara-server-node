import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import permissionItemValidationSchemas from '../validation';
import {IAddPermissionItemsEndpointParams} from './types';

export const addPermissionItemsJoiSchema = Joi.object<IAddPermissionItemsEndpointParams>()
  .keys({
    workspaceId: validationSchemas.resourceId,
    items: permissionItemValidationSchemas.itemInputList.required(),
  })
  .required();
