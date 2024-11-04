import {startJoiObject} from '../../../utils/validationUtils.js';
import {getFileBackendConfigsBaseJoiSchemaParts} from '../getConfigs/validation.js';
import {CountFileBackendConfigsEndpointParams} from './types.js';

export const countWorkspaceAgentTokenJoiSchema =
  startJoiObject<CountFileBackendConfigsEndpointParams>(
    getFileBackendConfigsBaseJoiSchemaParts
  ).required();
