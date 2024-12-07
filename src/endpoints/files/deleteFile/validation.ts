import Joi from 'joi';
import fileValidationSchemas from '../validation.js';
import {DeleteFileEndpointParams} from './types.js';

export const deleteFileJoiSchema = Joi.object<DeleteFileEndpointParams>()
  .keys({
    ...fileValidationSchemas.fileMatcherParts,
    clientMultipartId: Joi.string(),
    part: Joi.number().integer().min(0),
  })
  .required();
