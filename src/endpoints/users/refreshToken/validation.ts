import Joi from 'joi';
import kAgentTokenValidationSchemas from '../../agentTokens/validation.js';
import {RefreshUserTokenEndpointParams} from './types.js';

export const refreshUserTokenJoiSchema =
  Joi.object<RefreshUserTokenEndpointParams>()
    .keys({
      refreshToken: kAgentTokenValidationSchemas.refreshToken.required(),
    })
    .required();
