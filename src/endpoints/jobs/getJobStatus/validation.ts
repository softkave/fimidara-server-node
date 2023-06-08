import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';

export const getJobStatusJoiSchema = Joi.object()
  .keys({
    jobId: validationSchemas.resourceId.required(),
  })
  .required();
