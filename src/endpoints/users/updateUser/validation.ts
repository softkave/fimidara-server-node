import Joi from 'joi';
import userValidationSchemas from '../validation.js';

export const updateUserJoiSchema = Joi.object()
  .keys({
    firstName: userValidationSchemas.name.allow(null),
    lastName: userValidationSchemas.name.allow(null),
    email: userValidationSchemas.email.allow(null),
  })
  .required();
