import * as Joi from 'joi';
import fileValidationSchemas from '../validation';

export const deleteFileJoiSchema = Joi.object()
  .keys(fileValidationSchemas.fileMatcherParts)
  .required();
