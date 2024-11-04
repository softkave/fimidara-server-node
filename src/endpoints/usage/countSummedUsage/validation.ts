import {startJoiObject} from '../../../utils/validationUtils.js';
import {getSummedUsageBaseJoiSchemaParts} from '../getSummedUsage/validation.js';
import {CountSummedUsageEndpointParams} from './types.js';

export const countSummedUsageJoiSchema =
  startJoiObject<CountSummedUsageEndpointParams>(
    getSummedUsageBaseJoiSchemaParts
  ).required();
