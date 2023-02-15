import * as Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types';
import {endpointValidationSchemas} from '../../validation';
import {
  IGetWorkspaceClientAssignedTokensEndpointParams,
  IGetWorkspaceClientAssignedTokensEndpointParamsBase,
} from './types';

export const getWorkspaceClientAssignedTokenBaseJoiSchemaParts: JoiSchemaParts<IGetWorkspaceClientAssignedTokensEndpointParamsBase> =
  endpointValidationSchemas.optionalWorkspaceIdParts;

export const getWorkspaceClientAssignedTokenJoiSchema =
  Joi.object<IGetWorkspaceClientAssignedTokensEndpointParams>()
    .keys({
      ...getWorkspaceClientAssignedTokenBaseJoiSchemaParts,
      ...endpointValidationSchemas.paginationParts,
    })
    .required();
