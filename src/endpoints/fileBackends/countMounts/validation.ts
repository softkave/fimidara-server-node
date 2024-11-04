import {startJoiObject} from '../../../utils/validationUtils.js';
import {getFileBackendMountsBaseJoiSchemaParts} from '../getMounts/validation.js';
import {CountFileBackendMountsEndpointParams} from './types.js';

export const countFileBackendMountsJoiSchema =
  startJoiObject<CountFileBackendMountsEndpointParams>(
    getFileBackendMountsBaseJoiSchemaParts
  ).required();
