import * as Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils';
import fileValidationSchemas from '../validation';
import {UploadFileEndpointParams} from './types';

export const uploadFileJoiSchema = Joi.object<UploadFileEndpointParams>()
  .keys({
    ...fileValidationSchemas.fileMatcherParts,
    data: fileValidationSchemas.readable.required(),
    description: kValidationSchemas.description.allow(null, ''),
    mimetype: fileValidationSchemas.mimetype.allow(null, ''),
    encoding: fileValidationSchemas.encoding.allow(null),
  })
  .required();
