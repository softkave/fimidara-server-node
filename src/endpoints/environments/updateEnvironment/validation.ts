import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const environmentInputJoiSchema = Joi.object().keys({
  name: validationSchemas.name,
  description: validationSchemas.description,
});

export const updateEnvironmentJoiSchema = Joi.object()
  .keys({
    environmentId: validationSchemas.nanoid.required(),
    data: environmentInputJoiSchema.required(),
  })
  .required();
