import * as Joi from 'joi';
import {endpointValidationSchemas} from '../../validation';

export const getWorkspaceJoiSchema = Joi.object()
  .keys(endpointValidationSchemas.optionalWorkspaceIdParts)
  .required();
