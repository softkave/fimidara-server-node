import * as Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils';
import fileValidationSchemas from '../validation';
import {UpdateFileDetailsEndpointParams} from './types';

export const updateFileDetailsJoiSchema = Joi.object<UpdateFileDetailsEndpointParams>()
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
