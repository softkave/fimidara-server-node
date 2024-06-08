import Joi from 'joi';
import {kValidationRegExPatterns} from '../../utils/validationUtils.js';
import {kUserConstants} from './constants.js';

const email = Joi.string().trim().email();
const password = Joi.string()
  .trim()
  .min(kUserConstants.minPasswordLength)
  .max(kUserConstants.maxPasswordLength)
  .regex(kValidationRegExPatterns.password);
const name = Joi.string()
  .trim()
  .min(kUserConstants.minNameLength)
  .max(kUserConstants.maxNameLength);

const userValidationSchemas = {
  name,
  email,
  password,
};

export default userValidationSchemas;
