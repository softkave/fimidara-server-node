import * as Joi from 'joi';
import folderValidationSchemas from '../validation';

export const deleteFolderJoiSchema = Joi.object()
  .keys(folderValidationSchemas.folderMatcherParts)
  .required();
