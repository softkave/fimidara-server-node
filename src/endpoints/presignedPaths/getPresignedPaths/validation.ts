import * as Joi from 'joi';
import {kEndpointConstants} from '../../constants';
import {endpointValidationSchemas} from '../../validation';
import {GetPresignedPathsForFilesEndpointParams} from './types';
import fileValidationSchemas from '../../files/validation';

export const getPresignedPathsForFilesJoiSchema =
  Joi.object<GetPresignedPathsForFilesEndpointParams>()
    .keys({
      ...endpointValidationSchemas.optionalWorkspaceIdParts,
      files: Joi.array()
        .items(fileValidationSchemas.fileMatcherParts)
        .max(kEndpointConstants.maxPageSize),
    })
    .required();
