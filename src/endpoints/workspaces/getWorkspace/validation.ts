import Joi from 'joi';
import {endpointValidationSchemas} from '../../validation.js';

export const getWorkspaceJoiSchema = Joi.object()
  .keys(endpointValidationSchemas.optionalWorkspaceIdParts)
  .required();
