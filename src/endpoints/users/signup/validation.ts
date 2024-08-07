import Joi from 'joi';
import userValidationSchemas from '../validation.js';

export const signupJoiSchema = Joi.object()
  .keys({
    firstName: userValidationSchemas.name.required(),
    lastName: userValidationSchemas.name.required(),
    password: userValidationSchemas.password.required(),
    email: userValidationSchemas.email.required(),
  })
  .required();
