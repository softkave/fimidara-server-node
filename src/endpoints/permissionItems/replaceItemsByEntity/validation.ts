import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import permissionItemValidationSchemas from '../validation';

export const replacePermissionItemsByEntityJoiSchema = Joi.object()
  .keys({
    workspaceId: validationSchemas.resourceId,
    permissionEntityId: validationSchemas.resourceId.required(),
    permissionEntityType: validationSchemas.resourceType.required(),
    items: permissionItemValidationSchemas.itemInputByEntityList.required(),
  })
  .required();
