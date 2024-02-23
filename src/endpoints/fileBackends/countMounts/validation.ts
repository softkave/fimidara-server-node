import * as Joi from 'joi';
import {getFileBackendMountsBaseJoiSchemaParts} from '../getMounts/validation';
import {CountFileBackendMountsEndpointParams} from './types';

export const countFileBackendMountsJoiSchema =
  Joi.object<CountFileBackendMountsEndpointParams>()
    .keys(getFileBackendMountsBaseJoiSchemaParts)
    .required();
