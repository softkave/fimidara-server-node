import * as Joi from 'joi';
import userValidationSchemas from '../validation';

export const changePasswordWithPasswordJoiSchema = Joi.object().keys({
  password: userValidationSchemas.password.required(),
  currentPassword: userValidationSchemas.password.required(),
});
