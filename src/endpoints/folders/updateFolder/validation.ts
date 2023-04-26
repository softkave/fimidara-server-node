import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import folderValidationSchemas from '../validation';
import {UpdateFolderEndpointParams, UpdateFolderInput} from './types';

export const folderInputJoiSchema = Joi.object().keys({
  name: validationSchemas.name,
  description: validationSchemas.description,
});

export const updateFolderJoiSchema = Joi.object<UpdateFolderEndpointParams>()
  .keys({
    ...folderValidationSchemas.folderMatcherParts,
    folder: Joi.object<UpdateFolderInput>()
      .keys({
        description: validationSchemas.description.allow(null),
      })
      .required(),
  })
  .required();
