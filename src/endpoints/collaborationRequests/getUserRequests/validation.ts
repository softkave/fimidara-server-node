import * as Joi from 'joi';
import {endpointValidationSchemas} from '../../validation';
import {IGetUserCollaborationRequestsEndpointParams} from './types';

export const getUserRequestsJoiSchema = Joi.object<IGetUserCollaborationRequestsEndpointParams>()
  .keys({
    page: endpointValidationSchemas.page,
    pageSize: endpointValidationSchemas.pageSize,
  })
  .required();
