import * as Joi from 'joi';
import {endpointConstants} from '../../constants';
import fileValidationSchemas from '../validation';
import {GetFilePresignedPathsEndpointParams} from './types';

export const getFilePresignedPathsJoiSchema = Joi.object<GetFilePresignedPathsEndpointParams>()
  .keys({
    files: Joi.array()
      .items(fileValidationSchemas.fileMatcherParts)
      .max(endpointConstants.maxPageSize),
  })
  .required();
