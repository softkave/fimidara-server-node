import Joi from 'joi';
import {startJoiObject} from '../../../utils/validationUtils.js';
import {kEndpointConstants} from '../../constants.js';
import fileValidationSchemas from '../../files/validation.js';
import {endpointValidationSchemas} from '../../validation.js';
import {GetPresignedPathsForFilesEndpointParams} from './types.js';

export const getPresignedPathsForFilesJoiSchema =
  startJoiObject<GetPresignedPathsForFilesEndpointParams>({
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    files: Joi.array()
      .items(fileValidationSchemas.fileMatcherParts)
      .max(kEndpointConstants.maxPageSize),
  }).required();
