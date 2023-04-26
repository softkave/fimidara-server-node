import * as Joi from 'joi';
import {getWorkspaceAgentTokenBaseJoiSchemaParts} from '../getWorkspaceTokens/validation';
import {CountWorkspaceAgentTokensEndpointParams} from './types';

export const countWorkspaceAgentTokenJoiSchema =
  Joi.object<CountWorkspaceAgentTokensEndpointParams>()
    .keys(getWorkspaceAgentTokenBaseJoiSchemaParts)
    .required();
