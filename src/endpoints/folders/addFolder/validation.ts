import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import fileValidationSchemas from '../../files/validation';
import folderValidationSchemas from '../validation';

export const addFolderJoiSchema = Joi.object()
  .keys({
    organizationId: validationSchemas.nanoid.required(),
    folder: Joi.object()
      .keys({
        path: folderValidationSchemas.path.required(),
        description: validationSchemas.description.allow(null),
        isPublic: Joi.bool().allow(null),
        maxFileSizeInBytes: fileValidationSchemas.fileSizeInBytes.allow(null),
      })
      .required(),
  })
  .required();
