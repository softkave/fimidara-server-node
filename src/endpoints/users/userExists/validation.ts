import Joi from 'joi';
import userValidationSchemas from '../validation.js';

export const userExistsJoiSchema = Joi.object()
  .keys({
    email: userValidationSchemas.email.required(),
  })
  .required();
