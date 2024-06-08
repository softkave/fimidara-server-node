import Joi from 'joi';
import {getFileBackendMountsBaseJoiSchemaParts} from '../getMounts/validation.js';
import {CountFileBackendMountsEndpointParams} from './types.js';

export const countFileBackendMountsJoiSchema =
  Joi.object<CountFileBackendMountsEndpointParams>()
    .keys(getFileBackendMountsBaseJoiSchemaParts)
    .required();
