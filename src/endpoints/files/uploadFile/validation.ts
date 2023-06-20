import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import fileValidationSchemas from '../validation';
import {UploadFileEndpointParams} from './types';

export const uploadFileJoiSchema = Joi.object<UploadFileEndpointParams>()
  .keys({
    ...fileValidationSchemas.fileMatcherParts,
    description: validationSchemas.description.allow(null, ''),
    mimetype: fileValidationSchemas.mimetype.allow(null, ''),
    encoding: fileValidationSchemas.encoding.allow(null),
    extension: fileValidationSchemas.extension.allow(null, ''),
    data: fileValidationSchemas.buffer.required(),
  })
  .required();
