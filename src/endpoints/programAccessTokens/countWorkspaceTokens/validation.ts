import * as Joi from 'joi';
import {getWorkspaceProgramAccessTokenBaseJoiSchemaParts} from '../getWorkspaceTokens/validation';
import {ICountWorkspaceProgramAccessTokensEndpointParams} from './types';

export const countWorkspaceProgramAccessTokenJoiSchema =
  Joi.object<ICountWorkspaceProgramAccessTokensEndpointParams>()
    .keys(getWorkspaceProgramAccessTokenBaseJoiSchemaParts)
    .required();
