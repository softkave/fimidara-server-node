import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import permissionItemValidationSchemas from '../validation';
import {IReplacePermissionItemsByEntityEndpointParams} from './types';

export const replacePermissionItemsByEntityJoiSchema = Joi.object<IReplacePermissionItemsByEntityEndpointParams>()
  .keys({
    workspaceId: validationSchemas.resourceId,
    permissionEntityId: validationSchemas.resourceId.required(),
    permissionEntityType: validationSchemas.resourceType.required(),
    items: permissionItemValidationSchemas.itemInputByEntityList.required(),
  })
  .required();
