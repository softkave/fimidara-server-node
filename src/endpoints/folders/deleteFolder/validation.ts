import Joi from 'joi';
import folderValidationSchemas from '../validation.js';

export const deleteFolderJoiSchema = Joi.object()
  .keys(folderValidationSchemas.folderMatcherParts)
  .required();
