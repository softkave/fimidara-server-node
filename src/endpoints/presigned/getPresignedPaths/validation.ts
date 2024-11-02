import Joi from 'joi';
import {kEndpointConstants} from '../../constants.js';
import fileValidationSchemas from '../../files/validation.js';
import {endpointValidationSchemas} from '../../validation.js';
import {GetPresignedPathsForFilesEndpointParams} from './types.js';

export const getPresignedPathsForFilesJoiSchema =
  Joi.object<GetPresignedPathsForFilesEndpointParams>()
    .keys({
      ...endpointValidationSchemas.optionalWorkspaceIdParts,
      files: Joi.array()
        .items(fileValidationSchemas.fileMatcherParts)
        .max(kEndpointConstants.maxPageSize),
    })
    .required();
