import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import {permissionItemConstants} from '../constants';

export const deletePermissionItemsByIdJoiSchema = Joi.object()
  .keys({
    workspaceId: validationSchemas.resourceId,
    itemIds: Joi.array()
      .items(validationSchemas.resourceId.required())
      .max(permissionItemConstants.maxPermissionItemsSavedPerRequest)
      .required(),
  })
  .required();
