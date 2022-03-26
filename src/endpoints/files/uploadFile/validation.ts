import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import fileValidationSchemas from '../validation';
import {UploadFilePublicAccessActions} from './types';

export const uploadFileJoiSchema = Joi.object()
  .keys({
    ...fileValidationSchemas.fileMatcherParts,
    description: validationSchemas.description.allow(null),
    mimetype: fileValidationSchemas.mimetype.allow(null),
    encoding: fileValidationSchemas.encoding.allow(null),
    extension: fileValidationSchemas.extension.allow(null),
    data: fileValidationSchemas.buffer.required(),
    publicAccessActions: Joi.string().allow(
      ...Object.values(UploadFilePublicAccessActions),
      null
    ),
    // inheritParentPublicAccessOps: Joi.boolean().allow(null).default(true),
  })
  .required();
