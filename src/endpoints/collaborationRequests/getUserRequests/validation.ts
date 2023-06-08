import * as Joi from 'joi';
import {endpointValidationSchemas} from '../../validation';
import {GetUserCollaborationRequestsEndpointParams} from './types';

export const getUserRequestsJoiSchema = Joi.object<GetUserCollaborationRequestsEndpointParams>()
  .keys({
    page: endpointValidationSchemas.page,
    pageSize: endpointValidationSchemas.pageSize,
  })
  .required();
