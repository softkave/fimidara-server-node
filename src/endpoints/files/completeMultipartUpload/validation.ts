import Joi from 'joi';
import fileValidationSchemas from '../validation.js';
import {CompleteMultipartUploadEndpointParams} from './types.js';
import {kFileConstants} from '../constants.js';

export const completeMultipartUploadJoiSchema =
  Joi.object<CompleteMultipartUploadEndpointParams>()
    .keys({
      ...fileValidationSchemas.fileMatcherParts,
      multipartId: fileValidationSchemas.multipartId.required(),
      parts: Joi.array()
        .items(
          Joi.object({
            part: Joi.number().required(),
            partId: Joi.string().required(),
          })
        )
        .min(kFileConstants.minPartNumber)
        .max(kFileConstants.maxPartNumber)
        .required(),
    })
    .required();
