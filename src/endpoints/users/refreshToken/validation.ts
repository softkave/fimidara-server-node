import {startJoiObject} from '../../../utils/validationUtils.js';
import kAgentTokenValidationSchemas from '../../agentTokens/validation.js';
import {RefreshUserTokenEndpointParams} from './types.js';

export const refreshUserTokenJoiSchema =
  startJoiObject<RefreshUserTokenEndpointParams>({
    refreshToken: kAgentTokenValidationSchemas.refreshToken.required(),
  }).required();
