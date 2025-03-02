import Joi from 'joi';
import fileValidationSchemas from '../validation.js';
import {CompleteMultipartUploadEndpointParams} from './types.js';

export const completeMultipartUploadJoiSchema =
  Joi.object<CompleteMultipartUploadEndpointParams>()
    .keys({
      ...fileValidationSchemas.fileMatcherParts,
      clientMultipartId: fileValidationSchemas.clientMultipartId.required(),
    })
    .required();
