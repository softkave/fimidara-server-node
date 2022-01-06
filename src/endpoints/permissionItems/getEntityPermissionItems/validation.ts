import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const getEntityPermissionItemsJoiSchema = Joi.object()
  .keys({
    organizationId: validationSchemas.nanoid.required(),
    permissionEntityId: validationSchemas.nanoid.required(),
    permissionEntityType: validationSchemas.resourceType.required(),
  })
  .required();