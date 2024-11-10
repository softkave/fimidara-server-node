import Joi from 'joi';
import clientLogsValidationSchemas from '../validation.js';

export const ingestLogsJoiSchema = Joi.object()
  .keys({
    logs: clientLogsValidationSchemas.logsList.required(),
  })
  .required();
