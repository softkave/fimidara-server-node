import Joi from 'joi';
import {getWorkspaceSummedUsageBaseJoiSchemaParts} from '../getWorkspaceSummedUsage/validation.js';
import {CountWorkspaceSummedUsageEndpointParams} from './types.js';

export const countWorkspaceSummedUsageJoiSchema =
  Joi.object<CountWorkspaceSummedUsageEndpointParams>()
    .keys(getWorkspaceSummedUsageBaseJoiSchemaParts)
    .required();
