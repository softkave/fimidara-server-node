import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import folderValidationSchemas from '../validation.js';
import {AddFolderEndpointParams} from './types.js';

export const addFolderJoiSchema = Joi.object<AddFolderEndpointParams>()
  .keys({
    folderpath: folderValidationSchemas.folderpath.required(),
    description: kValidationSchemas.description.allow(null),
  })
  .required();
