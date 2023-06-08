import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import {fileConstants} from '../constants';
import fileValidationSchemas from '../validation';
import {ImageResizeFitEnumMap, ImageResizePositionEnumMap, ReadFileEndpointParams} from './types';

export const readFileJoiSchema = Joi.object<ReadFileEndpointParams>()
  .keys({
    ...fileValidationSchemas.fileMatcherParts,
    imageResize: Joi.object()
      .keys({
        width: Joi.number().max(fileConstants.maxFileWidth).allow(null),
        height: Joi.number().max(fileConstants.maxFileHeight).allow(null),
        fit: Joi.string()
          .valid(...Object.values(ImageResizeFitEnumMap))
          .allow(null),
        position: Joi.alternatives()
          .try(Joi.number(), Joi.string().valid(...Object.values(ImageResizePositionEnumMap)))
          .allow(null),
        background: validationSchemas.color.allow(null),
        withoutEnlargement: Joi.boolean().allow(null),
      })
      .allow(null),
  })
  .required();
