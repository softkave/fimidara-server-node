import * as Joi from 'joi';
import {validationSchemas} from '../../utilities/validationUtils';
import clientLogsConstants from './constants';

const log = Joi.object().keys({
  timestamp: validationSchemas.time.required(),
  level: Joi.string().max(clientLogsConstants.maxLevelLength).required(),
  message: Joi.string().max(clientLogsConstants.maxMessageLength).required(),
  service: Joi.string()
    .max(clientLogsConstants.maxServiceNameLength)
    .required(),
  stack: Joi.string().max(clientLogsConstants.maxStackLength),
});

const logsList = Joi.array().items(log).max(clientLogsConstants.maxBatch);
const clientLogsValidationSchemas = {log, logsList};
export default clientLogsValidationSchemas;
