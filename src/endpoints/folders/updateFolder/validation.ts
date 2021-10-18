import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const folderInputJoiSchema = Joi.object().keys({
  name: validationSchemas.name,
  description: validationSchemas.description,
});

export const updateFolderJoiSchema = Joi.object()
  .keys({
    folderId: validationSchemas.nanoid.required(),
    data: folderInputJoiSchema.required(),
  })
  .required();
