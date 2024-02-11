import * as Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils';
import fileValidationSchemas from '../validation';
import {IssuePresignedPathEndpointParams} from './types';

export const issuePresignedPathJoiSchema = Joi.object<IssuePresignedPathEndpointParams>()
  .keys({
    ...fileValidationSchemas.fileMatcherParts,
    expires: kValidationSchemas.time.allow(null),
    duration: Joi.number().integer().min(0).allow(null),
    usageCount: Joi.number().integer().min(0).allow(null),
    action: kValidationSchemas.crudActionOrList,
  })
  .required();
