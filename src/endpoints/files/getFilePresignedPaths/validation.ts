import * as Joi from 'joi';
import {endpointConstants} from '../../constants';
import {endpointValidationSchemas} from '../../validation';
import fileValidationSchemas from '../validation';
import {GetFilePresignedPathsEndpointParams} from './types';

export const getFilePresignedPathsJoiSchema = Joi.object<GetFilePresignedPathsEndpointParams>()
  .keys({
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    files: Joi.array()
      .items(fileValidationSchemas.fileMatcherParts)
      .max(endpointConstants.maxPageSize),
  })
  .required();
