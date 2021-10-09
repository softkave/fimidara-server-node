import * as Joi from 'joi';
import userValidationSchemas from '../validation';

export const loginJoiSchema = Joi.object()
  .keys({
    email: userValidationSchemas.email.required(),
    password: userValidationSchemas.password.required(),
  })
  .required();
