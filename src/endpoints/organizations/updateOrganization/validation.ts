import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const organizationInputJoiSchema = Joi.object().keys({
  name: validationSchemas.name.allow(null),
  description: validationSchemas.description.allow(null),
});

export const updateOrganizationJoiSchema = Joi.object()
  .keys({
    organizationId: validationSchemas.nanoid.required(),
    organization: organizationInputJoiSchema.required(),
  })
  .required();
