import * as Joi from 'joi';
import {endpointValidationSchemas} from '../../validation';

export const deleteWorkspaceJoiSchema = Joi.object()
  .keys(endpointValidationSchemas.optionalWorkspaceIdParts)
  .required();
