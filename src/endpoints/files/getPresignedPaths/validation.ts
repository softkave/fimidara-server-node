import * as Joi from 'joi';
import {endpointConstants} from '../../constants';
import {endpointValidationSchemas} from '../../validation';
import fileValidationSchemas from '../validation';
import {GetPresignedPathsForFilesEndpointParams} from './types';

export const getPresignedPathsForFilesJoiSchema =
  Joi.object<GetPresignedPathsForFilesEndpointParams>()
    .keys({
      ...endpointValidationSchemas.optionalWorkspaceIdParts,
      files: Joi.array()
        .items(fileValidationSchemas.fileMatcherParts)
        .max(endpointConstants.maxPageSize),
    })
    .required();
