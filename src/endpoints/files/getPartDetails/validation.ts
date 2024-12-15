import Joi from 'joi';
import {endpointValidationSchemas} from '../../validation.js';
import fileValidationSchemas from '../validation.js';
import {GetPartDetailsEndpointParams} from './types.js';

export const getPartDetailsJoiSchema =
  Joi.object<GetPartDetailsEndpointParams>()
    .keys({
      ...fileValidationSchemas.fileMatcherParts,
      continuationToken: endpointValidationSchemas.continuationToken,
    })
    .required();
