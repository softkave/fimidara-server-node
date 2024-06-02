import Joi from 'joi';
import {endpointValidationSchemas} from '../../validation.js';
import {GetUserWorkspacesEndpointParams} from './types.js';

export const getUserWorkspacesJoiSchema =
  Joi.object<GetUserWorkspacesEndpointParams>()
    .keys(endpointValidationSchemas.paginationParts)
    .required();
