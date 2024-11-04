import Joi from 'joi';
import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {kFileConstants} from '../constants.js';
import fileValidationSchemas from '../validation.js';
import {
  ImageFormatEnumMap,
  ImageResizeFitEnumMap,
  ImageResizeParams,
  ImageResizePositionEnumMap,
  ReadFileEndpointParams,
} from './types.js';

export const readFileJoiSchema = startJoiObject<ReadFileEndpointParams>({
  ...endpointValidationSchemas.optionalWorkspaceIdParts,
  ...fileValidationSchemas.fileMatcherParts,
  imageResize: startJoiObject<ImageResizeParams>({
    width: Joi.number().max(kFileConstants.maxFileWidth).allow(null),
    height: Joi.number().max(kFileConstants.maxFileHeight).allow(null),
    fit: Joi.string()
      .valid(...Object.values(ImageResizeFitEnumMap))
      .allow(null),
    position: Joi.alternatives()
      .try(
        Joi.number(),
        Joi.string().valid(...Object.values(ImageResizePositionEnumMap))
      )
      .allow(null),
    background: kValidationSchemas.color.allow(null),
    withoutEnlargement: Joi.boolean().allow(null),
  }).allow(null),
  imageFormat: Joi.string()
    .valid(...Object.values(ImageFormatEnumMap))
    .allow(null),
  download: Joi.boolean(),
}).required();
