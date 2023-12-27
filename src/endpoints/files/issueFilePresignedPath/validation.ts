import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import fileValidationSchemas from '../validation';
import {IssueFilePresignedPathEndpointParams} from './types';

export const issueFilePresignedPathJoiSchema =
  Joi.object<IssueFilePresignedPathEndpointParams>()
    .keys({
      ...fileValidationSchemas.fileMatcherParts,
      expires: validationSchemas.time.allow(null),
      duration: Joi.number().integer().min(0).allow(null),
      usageCount: Joi.number().integer().min(0).allow(null),
    })
    .required();
