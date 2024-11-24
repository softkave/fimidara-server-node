import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import {kFileConstants} from '../constants.js';
import fileValidationSchemas from '../validation.js';
import {UploadFileEndpointParams} from './types.js';

export const uploadFileJoiSchema = Joi.object<UploadFileEndpointParams>()
  .keys({
    ...fileValidationSchemas.fileMatcherParts,
    data: fileValidationSchemas.readable.required(),
    size: fileValidationSchemas.fileSizeInBytes.required(),
    description: kValidationSchemas.description.allow(null, ''),
    mimetype: fileValidationSchemas.mimetype.allow(null, ''),
    encoding: fileValidationSchemas.encoding.allow(null),
    clientMultipartId: Joi.string(),
    part: Joi.number().integer().min(0),
    partLength: Joi.number().integer().min(1).max(kFileConstants.maxPartLength),
  })
  .required();
