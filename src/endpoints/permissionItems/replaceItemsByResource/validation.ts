import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import permissionItemValidationSchemas from '../validation';

export const replacePermissionItemsByResourceJoiSchema = Joi.object()
  .keys({
    permissionOwnerId: validationSchemas.nanoid.required(),
    permissionOwnerType: validationSchemas.resourceType.required(),
    organizationId: validationSchemas.nanoid.required(),
    itemResourceId: validationSchemas.nanoid.allow(null),
    itemResourceType: validationSchemas.resourceType.required(),
    items: permissionItemValidationSchemas.itemInputByResourceList.required(),
  })
  .required();
