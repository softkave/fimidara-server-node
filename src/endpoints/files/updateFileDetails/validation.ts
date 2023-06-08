import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import fileValidationSchemas from '../validation';
import {UpdateFileDetailsEndpointParams} from './types';

export const updateFileDetailsJoiSchema = Joi.object<UpdateFileDetailsEndpointParams>()
  .keys({
    ...fileValidationSchemas.fileMatcherParts,
    file: Joi.object()
      .keys({
        description: validationSchemas.description.allow(null),
        mimetype: fileValidationSchemas.mimetype.allow(null),
        publicAccessAction: fileValidationSchemas.publicAccessAction.allow(null),
      })
      .required(),
  })
  .required();
