import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import {permissionItemConstants} from '../constants';

export const deletePermissionItemsByIdJoiSchema = Joi.object()
  .keys({
    organizationId: validationSchemas.nanoid,
    itemIds: Joi.array()
      .items(validationSchemas.nanoid.required())
      .max(permissionItemConstants.maxPermissionItemsSavedPerRequest)
      .required(),
  })
  .required();
