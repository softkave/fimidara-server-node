import * as Joi from 'joi';
import fileValidationSchemas from '../validation';
import {DeleteFileEndpointParams} from './types';

export const deleteFileJoiSchema = Joi.object<DeleteFileEndpointParams>()
  .keys(fileValidationSchemas.fileMatcherParts)
  .required();
