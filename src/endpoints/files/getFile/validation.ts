import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import folderValidationSchemas from '../../folders/validation';
import {fileConstants} from '../constants';

export const getFileJoiSchema = Joi.object()
  .keys({
    organizationId: validationSchemas.nanoid.allow([null]),
    path: folderValidationSchemas.path.required(),
    imageTranformation: Joi.object()
      .keys({
        width: Joi.number().max(fileConstants.maxFileWidth).allow([null]),
        height: Joi.number().max(fileConstants.maxFileHeight).allow([null]),
      })
      .allow([null]),
  })
  .required();
