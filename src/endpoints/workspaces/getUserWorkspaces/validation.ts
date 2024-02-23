import * as Joi from 'joi';
import {endpointValidationSchemas} from '../../validation';
import {GetUserWorkspacesEndpointParams} from './types';

export const getUserWorkspacesJoiSchema = Joi.object<GetUserWorkspacesEndpointParams>()
  .keys(endpointValidationSchemas.paginationParts)
  .required();
