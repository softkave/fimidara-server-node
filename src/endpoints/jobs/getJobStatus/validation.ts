import * as Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils';

export const getJobStatusJoiSchema = Joi.object()
  .keys({
    jobId: kValidationSchemas.resourceId.required(),
  })
  .required();
