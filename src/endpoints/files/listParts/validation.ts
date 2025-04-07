import Joi from 'joi';
import {endpointValidationSchemas} from '../../validation.js';
import fileValidationSchemas from '../validation.js';
import {ListPartsEndpointParams} from './types.js';

export const listPartsJoiSchema = Joi.object<ListPartsEndpointParams>()
  .keys({
    ...fileValidationSchemas.fileMatcherParts,
    ...endpointValidationSchemas.paginationParts,
  })
  .required();
