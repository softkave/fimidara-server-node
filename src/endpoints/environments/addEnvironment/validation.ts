import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const newEnvironmentJoiSchema = Joi.object().keys({
  name: validationSchemas.name.required(),
  description: validationSchemas.description.allow(null),
  organizationId: validationSchemas.nanoid.required(),
});

export const addEnvironmentJoiSchema = Joi.object()
  .keys({
    environment: newEnvironmentJoiSchema.required(),
  })
  .required();
