import * as Joi from 'joi';
import {getWorkspaceClientAssignedTokenBaseJoiSchemaParts} from '../getWorkspaceTokens/validation';
import {ICountWorkspaceClientAssignedTokensEndpointParams} from './types';

export const countWorkspaceClientAssignedTokenJoiSchema =
  Joi.object<ICountWorkspaceClientAssignedTokensEndpointParams>()
    .keys(getWorkspaceClientAssignedTokenBaseJoiSchemaParts)
    .required();
