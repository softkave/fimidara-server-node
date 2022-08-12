import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const getResourcePermissionItemsJoiSchema = Joi.object()
  .keys({
    workspaceId: validationSchemas.resourceId,
    itemResourceId: validationSchemas.resourceId.allow(null),
    itemResourceType: validationSchemas.resourceType.required(),
    permissionOwnerId: validationSchemas.resourceId.allow(null),
    permissionOwnerType: validationSchemas.resourceType.allow(null),
  })
  .required();
