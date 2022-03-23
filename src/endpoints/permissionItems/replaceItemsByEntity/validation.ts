import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import permissionItemValidationSchemas from '../validation';

export const replacePermissionItemsByEntityJoiSchema = Joi.object()
  .keys({
    organizationId: validationSchemas.nanoid.required(),
    permissionEntityId: validationSchemas.nanoid.required(),
    permissionEntityType: validationSchemas.resourceType.required(),
    items: permissionItemValidationSchemas.itemInputByEntityList.required(),
  })
  .required();
