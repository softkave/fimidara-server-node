import * as Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types';
import {endpointValidationSchemas} from '../../validation';
import {
  GetWorkspaceAgentTokensEndpointParams,
  GetWorkspaceAgentTokensEndpointParamsBase,
} from './types';

export const getWorkspaceAgentTokenBaseJoiSchemaParts: JoiSchemaParts<GetWorkspaceAgentTokensEndpointParamsBase> =
  endpointValidationSchemas.optionalWorkspaceIdParts;

export const getWorkspaceAgentTokenJoiSchema = Joi.object<GetWorkspaceAgentTokensEndpointParams>()
  .keys({
    ...getWorkspaceAgentTokenBaseJoiSchemaParts,
    ...endpointValidationSchemas.paginationParts,
  })
  .required();
