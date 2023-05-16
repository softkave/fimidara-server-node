import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import fileValidationSchemas from '../validation';

export const issueFilePresignedPathJoiSchema = Joi.object()
  .keys({
    ...fileValidationSchemas.fileMatcherParts,
    expires: validationSchemas.time.allow(null),
    duration: Joi.number().integer().min(0).allow(null),
    usageCount: Joi.number().integer().min(0).allow(null),
  })
  .required();
