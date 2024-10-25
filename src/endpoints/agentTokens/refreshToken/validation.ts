import Joi from 'joi';
import {endpointValidationSchemas} from '../../validation.js';
import kAgentTokenValidationSchemas from '../validation.js';
import {RefreshAgentTokenEndpointParams} from './types.js';

export const refreshAgentTokenJoiSchema =
  Joi.object<RefreshAgentTokenEndpointParams>()
    .keys({
      ...endpointValidationSchemas.workspaceResourceParts,
      refreshToken: kAgentTokenValidationSchemas.refreshToken.required(),
    })
    .required();
