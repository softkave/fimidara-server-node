import * as Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils';
import folderValidationSchemas from '../validation';
import {AddFolderEndpointParams, NewFolderInput} from './types';

export const addFolderJoiSchema = Joi.object<AddFolderEndpointParams>()
  .keys({
    folder: Joi.object<NewFolderInput>()
      .keys({
        folderpath: folderValidationSchemas.folderpath.required(),
        description: kValidationSchemas.description.allow(null),
      })
      .required(),
  })
  .required();
