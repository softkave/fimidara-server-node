import * as Joi from 'joi';
import folderValidationSchemas from '../validation';

export const listFolderContentJoiSchema = Joi.object()
  .keys(folderValidationSchemas.folderMatcherParts)
  .required();
