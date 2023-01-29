import * as Joi from 'joi';
import {endpointValidationSchemas} from '../../validation';
import {IGetUserWorkspacesEndpointParams} from './types';

export const getUserWorkspacesJoiSchema = Joi.object<IGetUserWorkspacesEndpointParams>()
  .keys({
    page: endpointValidationSchemas.page,
    pageSize: endpointValidationSchemas.pageSize,
  })
  .required();
