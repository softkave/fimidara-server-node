import * as Joi from 'joi';
import {kEndpointConstants} from '../../constants.js';
import {endpointValidationSchemas} from '../../validation.js';
import {GetPresignedPathsForFilesEndpointParams} from './types.js';
import fileValidationSchemas from '../../files/validation.js';

export const getPresignedPathsForFilesJoiSchema =
  Joi.object<GetPresignedPathsForFilesEndpointParams>()
    .keys({
      ...endpointValidationSchemas.optionalWorkspaceIdParts,
      files: Joi.array()
        .items(fileValidationSchemas.fileMatcherParts)
        .max(kEndpointConstants.maxPageSize),
    })
    .required();
