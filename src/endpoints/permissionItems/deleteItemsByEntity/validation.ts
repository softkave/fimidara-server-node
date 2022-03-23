import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import permissionItemValidationSchemas from '../validation';

export const deletePermissionItemsByEntityJoiSchema = Joi.object()
  .keys({
    organizationId: validationSchemas.nanoid.required(),
    permissionEntityId: validationSchemas.nanoid.required(),
    permissionEntityType: validationSchemas.resourceType.required(),
    itemIds: permissionItemValidationSchemas.itemIds.required(),
  })
  .required();
