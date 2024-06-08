import Joi from 'joi';
import {endpointValidationSchemas} from '../../validation.js';

export const deleteWorkspaceJoiSchema = Joi.object()
  .keys(endpointValidationSchemas.optionalWorkspaceIdParts)
  .required();
