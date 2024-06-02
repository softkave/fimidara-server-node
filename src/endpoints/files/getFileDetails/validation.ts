import Joi from 'joi';
import fileValidationSchemas from '../validation.js';
import {GetFileDetailsEndpointParams} from './types.js';

export const getFileDetailsJoiSchema =
  Joi.object<GetFileDetailsEndpointParams>()
    .keys(fileValidationSchemas.fileMatcherParts)
    .required();
