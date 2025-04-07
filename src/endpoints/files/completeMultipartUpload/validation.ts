import Joi from 'joi';
import {kFileConstants} from '../constants.js';
import fileValidationSchemas from '../validation.js';
import {CompleteMultipartUploadEndpointParams} from './types.js';

export const completeMultipartUploadJoiSchema =
  Joi.object<CompleteMultipartUploadEndpointParams>()
    .keys({
      ...fileValidationSchemas.fileMatcherParts,
      clientMultipartId: fileValidationSchemas.clientMultipartId.required(),
      parts: Joi.array()
        .items(
          Joi.object({
            part: Joi.number().required(),
          })
        )
        .min(1)
        .max(kFileConstants.maxPartNumber)
        .required(),
    })
    .required();
