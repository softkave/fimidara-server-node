import * as Joi from 'joi';
import {getWorkspaceAgentTokenBaseJoiSchemaParts} from '../getWorkspaceTokens/validation';
import {ICountWorkspaceAgentTokensEndpointParams} from './types';

export const countWorkspaceAgentTokenJoiSchema =
  Joi.object<ICountWorkspaceAgentTokensEndpointParams>()
    .keys(getWorkspaceAgentTokenBaseJoiSchemaParts)
    .required();
