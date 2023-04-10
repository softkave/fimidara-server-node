import * as Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types';
import {endpointValidationSchemas} from '../../validation';
import {
  IGetWorkspaceAgentTokensEndpointParams,
  IGetWorkspaceAgentTokensEndpointParamsBase,
} from './types';

export const getWorkspaceAgentTokenBaseJoiSchemaParts: JoiSchemaParts<IGetWorkspaceAgentTokensEndpointParamsBase> =
  endpointValidationSchemas.optionalWorkspaceIdParts;

export const getWorkspaceAgentTokenJoiSchema = Joi.object<IGetWorkspaceAgentTokensEndpointParams>()
  .keys({
    ...getWorkspaceAgentTokenBaseJoiSchemaParts,
    ...endpointValidationSchemas.paginationParts,
  })
  .required();
