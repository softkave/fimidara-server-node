import * as Joi from 'joi';
import fileValidationSchemas from '../validation';
import {GetFileDetailsEndpointParams} from './types';

export const getFileDetailsJoiSchema = Joi.object<GetFileDetailsEndpointParams>()
  .keys(fileValidationSchemas.fileMatcherParts)
  .required();
