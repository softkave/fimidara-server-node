import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import {permissionItemConstants} from '../constants';

export const addPermissionItemsJoiSchema = Joi.object()
  .keys({
    organizationId: validationSchemas.nanoid.required(),
    permissionEntityId: validationSchemas.nanoid.required(),
    permissionEntityType: validationSchemas.resourceType.required(),
    items: Joi.array()
      .items(
        Joi.object().keys({
          permissionOwnerId: validationSchemas.nanoid.required(),
          permissionOwnerType: validationSchemas.resourceType.required(),
          resourceId: validationSchemas.nanoid.allow([null]),
          resourceType: validationSchemas.resourceType.required(),
          action: validationSchemas.crudActions.required(),
          isExclusion: Joi.boolean().allow([null]),
          isForPermissionOwnerOnly: Joi.boolean().allow([null]),
        })
      )
      .max(permissionItemConstants.maxPermissionItemsSavedPerRequest)
      .required(),
  })
  .required();
