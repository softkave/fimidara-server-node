import Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types.js';
import {endpointValidationSchemas} from '../../validation.js';
import {
  GetWorkspaceAgentTokensEndpointParams,
  GetWorkspaceAgentTokensEndpointParamsBase,
} from './types.js';

export const getWorkspaceAgentTokenBaseJoiSchemaParts: JoiSchemaParts<GetWorkspaceAgentTokensEndpointParamsBase> =
  endpointValidationSchemas.optionalWorkspaceIdParts;

export const getWorkspaceAgentTokenJoiSchema =
  Joi.object<GetWorkspaceAgentTokensEndpointParams>()
    .keys({
      ...getWorkspaceAgentTokenBaseJoiSchemaParts,
      ...endpointValidationSchemas.paginationParts,
      shouldEncode: Joi.boolean().default(false),
    })
    .required();
