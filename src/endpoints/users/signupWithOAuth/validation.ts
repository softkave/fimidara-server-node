import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import userValidationSchemas from '../validation.js';

export const signupWithOAuthJoiSchema = Joi.object()
  .keys({
    name: userValidationSchemas.name.required(),
    email: userValidationSchemas.email.required(),
    emailVerifiedAt: Joi.date().optional(),
    oauthUserId: kValidationSchemas.providedResourceId.required(),
  })
  .required();
