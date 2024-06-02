import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import fileValidationSchemas from '../../files/validation.js';
import {IssuePresignedPathEndpointParams} from './types.js';

export const issuePresignedPathJoiSchema =
  Joi.object<IssuePresignedPathEndpointParams>()
    .keys({
      ...fileValidationSchemas.fileMatcherParts,
      expires: kValidationSchemas.time.allow(null),
      duration: Joi.number().integer().min(0).allow(null),
      usageCount: Joi.number().integer().min(0).allow(null),
      action: kValidationSchemas.crudActionOrList,
    })
    .required();
