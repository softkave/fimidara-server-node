import Joi from 'joi';
import userValidationSchemas from '../validation.js';
import {ChangePasswordWithTokenEndpointParams} from './types.js';

export const changePasswordWithTokenJoiSchema =
  Joi.object<ChangePasswordWithTokenEndpointParams>().keys({
    password: userValidationSchemas.password.required(),
  });
