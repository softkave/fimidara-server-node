import * as Joi from 'joi';
import fileValidationSchemas from '../validation';

export const getFileDetailsJoiSchema = Joi.object()
  .keys(fileValidationSchemas.fileMatcherParts)
  .required();
