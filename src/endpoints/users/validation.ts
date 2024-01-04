import * as Joi from 'joi';
import {kValidationRegExPatterns} from '../../utils/validationUtils';
import {userConstants} from './constants';

const email = Joi.string().trim().email();
const password = Joi.string()
  .trim()
  .min(userConstants.minPasswordLength)
  .max(userConstants.maxPasswordLength)
  .regex(kValidationRegExPatterns.password);
const name = Joi.string()
  .trim()
  .min(userConstants.minNameLength)
  .max(userConstants.maxNameLength);

const userValidationSchemas = {
  name,
  email,
  password,
};

export default userValidationSchemas;
