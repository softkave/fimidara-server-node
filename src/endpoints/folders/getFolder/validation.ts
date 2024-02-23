import * as Joi from 'joi';
import folderValidationSchemas from '../validation';

export const getFolderJoiSchema = Joi.object()
  .keys(folderValidationSchemas.folderMatcherParts)
  .required();
