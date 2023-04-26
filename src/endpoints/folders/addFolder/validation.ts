import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import folderValidationSchemas from '../validation';
import {AddFolderEndpointParams, NewFolderInput} from './types';

export const addFolderJoiSchema = Joi.object<AddFolderEndpointParams>()
  .keys({
    folder: Joi.object<NewFolderInput>()
      .keys({
        folderpath: folderValidationSchemas.folderpath.required(),
        description: validationSchemas.description.allow(null),
      })
      .required(),
  })
  .required();
