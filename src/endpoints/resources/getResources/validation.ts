import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import resourcesValidationSchemas from '../validation';

export const getResourcesJoiSchema = Joi.object()
  .keys({
    organizationId: validationSchemas.nanoid.required(),
    resources: resourcesValidationSchemas.fetchResourceItemList.required(),
  })
  .required();
