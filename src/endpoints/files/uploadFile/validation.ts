import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import tagValidationSchemas from '../../tags/validation';
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
    publicAccessAction: Joi.string().allow(
      ...Object.values(UploadFilePublicAccessActions),
      null
    ),
    tags: tagValidationSchemas.assignedTagsList.allow(null),
  })
  .required();
