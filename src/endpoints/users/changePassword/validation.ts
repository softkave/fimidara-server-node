import * as Joi from 'joi';
import userValidationSchemas from '../validation';

export const changePasswordJoiSchema = Joi.object().keys({
  password: userValidationSchemas.password.required(),
});
