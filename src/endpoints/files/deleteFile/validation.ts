import Joi from 'joi';
import fileValidationSchemas from '../validation.js';
import {DeleteFileEndpointParams} from './types.js';

export const deleteFileJoiSchema = Joi.object<DeleteFileEndpointParams>()
  .keys({
    ...fileValidationSchemas.fileMatcherParts,
    multipartId: fileValidationSchemas.multipartId,
    part: fileValidationSchemas.part,
  })
  .required();
