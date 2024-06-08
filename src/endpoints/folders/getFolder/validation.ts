import Joi from 'joi';
import folderValidationSchemas from '../validation.js';

export const getFolderJoiSchema = Joi.object()
  .keys(folderValidationSchemas.folderMatcherParts)
  .required();
