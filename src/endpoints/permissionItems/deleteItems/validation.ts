import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import {permissionItemConstants} from '../constants';

export const deletePermissionItemsJoiSchema = Joi.object()
  .keys({
    organizationId: validationSchemas.nanoid.required(),
    permissionEntityId: validationSchemas.nanoid.required(),
    permissionEntityType: validationSchemas.resourceType.required(),
    itemIds: Joi.array()
      .items(validationSchemas.nanoid.required())
      .max(permissionItemConstants.maxPermissionItemsSavedPerRequest)
      .unique()
      .required(),
  })
  .required();
