import * as Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils';
import {kFileConstants} from '../constants';
import fileValidationSchemas from '../validation';
import {
  ImageFormatEnumMap,
  ImageResizeFitEnumMap,
  ImageResizePositionEnumMap,
  ReadFileEndpointParams,
} from './types';

export const readFileJoiSchema = Joi.object<ReadFileEndpointParams>()
  .keys({
    ...fileValidationSchemas.fileMatcherParts,
    imageResize: Joi.object()
      .keys({
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
      })
      .allow(null),
    imageFormat: Joi.string()
      .valid(...Object.values(ImageFormatEnumMap))
      .allow(null),
  })
  .required();
