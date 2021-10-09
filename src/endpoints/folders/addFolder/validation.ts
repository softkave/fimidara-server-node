import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import fileValidationSchemas from '../../files/validation';
import folderValidationSchemas from '../validation';

export const newFolderJoiSchema = Joi.object().keys({
  organizationId: validationSchemas.nanoid.required(),
  environmentId: validationSchemas.nanoid.required(),
  name: folderValidationSchemas.concatFolderName.required(),
  description: validationSchemas.description,
  maxFileSize: fileValidationSchemas.fileSize,
});

export const addFolderJoiSchema = Joi.object()
  .keys({
    folder: newFolderJoiSchema.required(),
  })
  .required();
