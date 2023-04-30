import * as Joi from 'joi';
import userValidationSchemas from '../validation';
import {ChangePasswordWithTokenEndpointParams} from './types';

export const changePasswordWithTokenJoiSchema =
  Joi.object<ChangePasswordWithTokenEndpointParams>().keys({
    password: userValidationSchemas.password.required(),
  });
