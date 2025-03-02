import Joi from 'joi';
import fileValidationSchemas from '../validation.js';
import {StartMultipartUploadEndpointParams} from './types.js';

export const startMultipartUploadJoiSchema =
  Joi.object<StartMultipartUploadEndpointParams>()
    .keys({
      ...fileValidationSchemas.fileMatcherParts,
      clientMultipartId: fileValidationSchemas.clientMultipartId.required(),
    })
    .required();
