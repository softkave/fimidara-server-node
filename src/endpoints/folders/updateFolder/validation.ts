import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import fileValidationSchemas from '../../files/validation';
import folderValidationSchemas from '../validation';

export const folderInputJoiSchema = Joi.object().keys({
  name: validationSchemas.name,
  description: validationSchemas.description,
});

export const updateFolderJoiSchema = Joi.object()
  .keys({
    organizationId: validationSchemas.nanoid.allow(null),
    path: folderValidationSchemas.path.required(),
    folder: Joi.object()
      .keys({
        isPublic: Joi.bool().allow(null),
        description: validationSchemas.description.allow(null),
        maxFileSizeInBytes: fileValidationSchemas.fileSizeInBytes.allow(null),
      })
      .required(),
  })
  .required();
