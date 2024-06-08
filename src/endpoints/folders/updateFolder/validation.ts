import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import folderValidationSchemas from '../validation.js';
import {UpdateFolderEndpointParams, UpdateFolderInput} from './types.js';

export const folderInputJoiSchema = Joi.object().keys({
  name: kValidationSchemas.name,
  description: kValidationSchemas.description,
});

export const updateFolderJoiSchema = Joi.object<UpdateFolderEndpointParams>()
  .keys({
    ...folderValidationSchemas.folderMatcherParts,
    folder: Joi.object<UpdateFolderInput>()
      .keys({
        description: kValidationSchemas.description.allow(null),
      })
      .required(),
  })
  .required();
