import * as Joi from 'joi';
import {getWorkspaceSummedUsageBaseJoiSchemaParts} from '../getWorkspaceSummedUsage/validation';
import {ICountWorkspaceSummedUsageEndpointParams} from './types';

export const countWorkspaceSummedUsageJoiSchema =
  Joi.object<ICountWorkspaceSummedUsageEndpointParams>()
    .keys(getWorkspaceSummedUsageBaseJoiSchemaParts)
    .required();
