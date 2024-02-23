import * as Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils';
import folderValidationSchemas from '../validation';
import {UpdateFolderEndpointParams, UpdateFolderInput} from './types';

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
