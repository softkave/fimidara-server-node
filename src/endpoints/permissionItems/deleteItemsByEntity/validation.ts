import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import permissionItemValidationSchemas from '../validation';

export const deletePermissionItemsByEntityJoiSchema = Joi.object()
  .keys({
    workspaceId: validationSchemas.resourceId,
    entityId: validationSchemas.resourceId.required(),
    permissionEntityType: validationSchemas.resourceType.required(),
    itemIds: permissionItemValidationSchemas.itemIds.required(),
  })
  .required();
