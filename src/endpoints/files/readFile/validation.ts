import * as Joi from 'joi';
import {fileConstants} from '../constants';
import fileValidationSchemas from '../validation';
import {ReadFileEndpointParams} from './types';

export const readFileJoiSchema = Joi.object<ReadFileEndpointParams>()
  .keys({
    ...fileValidationSchemas.fileMatcherParts,
    imageTranformation: Joi.object()
      .keys({
        width: Joi.number().max(fileConstants.maxFileWidth).allow(null),
        height: Joi.number().max(fileConstants.maxFileHeight).allow(null),
      })
      .allow(null),
  })
  .required();
