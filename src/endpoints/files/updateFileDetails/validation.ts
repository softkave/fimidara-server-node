import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import fileValidationSchemas from '../validation.js';
import {UpdateFileDetailsEndpointParams} from './types.js';

export const updateFileDetailsJoiSchema =
  Joi.object<UpdateFileDetailsEndpointParams>()
    .keys({
      ...fileValidationSchemas.fileMatcherParts,
      file: Joi.object()
        .keys({
          description: kValidationSchemas.description.allow(null),
          mimetype: fileValidationSchemas.mimetype.allow(null),
        })
        .required(),
    })
    .required();
