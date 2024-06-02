import Joi from 'joi';
import {getWorkspaceAgentTokenBaseJoiSchemaParts} from '../getWorkspaceTokens/validation.js';
import {CountWorkspaceAgentTokensEndpointParams} from './types.js';

export const countWorkspaceAgentTokenJoiSchema =
  Joi.object<CountWorkspaceAgentTokensEndpointParams>()
    .keys(getWorkspaceAgentTokenBaseJoiSchemaParts)
    .required();
