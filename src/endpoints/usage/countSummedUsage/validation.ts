import Joi from 'joi';
import {getWorkspaceSummedUsageBaseJoiSchemaParts} from '../getSummedUsage/validation.js';
import {CountSummedUsageEndpointParams} from './types.js';

export const countSummedUsageJoiSchema =
  Joi.object<CountSummedUsageEndpointParams>()
    .keys(getWorkspaceSummedUsageBaseJoiSchemaParts)
    .required();
