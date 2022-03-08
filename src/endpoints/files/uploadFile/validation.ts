import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import folderValidationSchemas from '../../folders/validation';
import fileValidationSchemas from '../validation';
import {UploadFilePublicAccessActions} from './types';

export const uploadFileJoiSchema = Joi.object()
  .keys({
    organizationId: validationSchemas.nanoid.allow(null),
    path: folderValidationSchemas.path.required(),
    description: validationSchemas.description.allow(null),
    mimetype: fileValidationSchemas.mimetype.allow(null),
    encoding: fileValidationSchemas.encoding.allow(null),
    extension: fileValidationSchemas.extension.allow(null),
    data: fileValidationSchemas.buffer.required(),
    publicAccessActions: Joi.string().allow(
      ...Object.values(UploadFilePublicAccessActions),
      null
    ),
    inheritParentPublicAccessOps: Joi.boolean().allow(null).default(true),
  })
  .required();
