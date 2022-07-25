import Joi from 'joi';
import {clientAssignedTokenConstants} from './constants';

const providedResourceId = Joi.string().max(
  clientAssignedTokenConstants.providedResourceMaxLength
);

const clientAssignedTokenValidationSchemas = {providedResourceId};

export default clientAssignedTokenValidationSchemas;
