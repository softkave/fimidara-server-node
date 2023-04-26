import * as Joi from 'joi';
import userValidationSchemas from '../validation';

export const changePasswordWithTokenJoiSchema = Joi.object().keys({
  password: userValidationSchemas.password.required(),
});
