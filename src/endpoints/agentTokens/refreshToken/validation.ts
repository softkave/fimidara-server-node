import {startJoiObject} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import kAgentTokenValidationSchemas from '../validation.js';
import {RefreshAgentTokenEndpointParams} from './types.js';

export const refreshAgentTokenJoiSchema =
  startJoiObject<RefreshAgentTokenEndpointParams>({
    ...endpointValidationSchemas.workspaceResourceParts,
    refreshToken: kAgentTokenValidationSchemas.refreshToken.required(),
  }).required();
