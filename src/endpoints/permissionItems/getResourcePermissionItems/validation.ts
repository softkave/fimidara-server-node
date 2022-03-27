import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const getResourcePermissionItemsJoiSchema = Joi.object()
  .keys({
    organizationId: validationSchemas.nanoid.required(),
    itemResourceId: validationSchemas.nanoid.allow(null),
    itemResourceType: validationSchemas.resourceType.required(),
  })
  .required();
