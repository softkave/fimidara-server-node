import * as Joi from 'joi';
import clientLogsValidationSchemas from '../validation';

export const ingestLogsJoiSchema = Joi.object()
  .keys({
    logs: clientLogsValidationSchemas.logsList.required(),
  })
  .required();
