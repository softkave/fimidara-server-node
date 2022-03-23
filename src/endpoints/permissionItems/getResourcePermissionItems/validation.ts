import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const getResourcePermissionItemsJoiSchema = Joi.object()
  .keys({
    organizationId: validationSchemas.nanoid.required(),
    itemResourceId: validationSchemas.nanoid.required(),
    itemResourceType: validationSchemas.resourceType.required(),
  })
  .required();
