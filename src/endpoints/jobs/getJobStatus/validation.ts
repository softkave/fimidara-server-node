import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';

export const getJobStatusJoiSchema = Joi.object()
  .keys({
    jobId: kValidationSchemas.resourceId.required(),
  })
  .required();
