import * as Joi from 'joi';
import {getWorkspaceSummedUsageBaseJoiSchemaParts} from '../getWorkspaceSummedUsage/validation';
import {CountWorkspaceSummedUsageEndpointParams} from './types';

export const countWorkspaceSummedUsageJoiSchema =
  Joi.object<CountWorkspaceSummedUsageEndpointParams>()
    .keys(getWorkspaceSummedUsageBaseJoiSchemaParts)
    .required();
