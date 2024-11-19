import Joi from 'joi';
import fileValidationSchemas from '../validation.js';
import {GetPartDetailsEndpointParams} from './types.js';

export const getPartDetailsJoiSchema =
  Joi.object<GetPartDetailsEndpointParams>()
    .keys(fileValidationSchemas.fileMatcherParts)
    .required();
