import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import fileValidationSchemas from '../validation';

export const newFileJoiSchema = Joi.object().keys({
  name: validationSchemas.name.required(),
  description: validationSchemas.description.allow(null),
  organizationId: validationSchemas.nanoid.required(),
  environmentId: validationSchemas.nanoid.required(),
  folderId: validationSchemas.nanoid,
  mimetype: fileValidationSchemas.mime.required(),
  size: fileValidationSchemas.fileSize.required(),
  encoding: fileValidationSchemas.encoding,
  file: fileValidationSchemas.file.required(),
  meta: fileValidationSchemas.meta,
});

export const uploadFileJoiSchema = Joi.object()
  .keys({
    file: newFileJoiSchema.required(),
  })
  .required();
