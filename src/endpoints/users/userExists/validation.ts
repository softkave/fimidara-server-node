import * as Joi from 'joi';
import userValidationSchemas from '../validation';

export const userExistsJoiSchema = Joi.object()
  .keys({
    email: userValidationSchemas.email.required(),
  })
  .required();
