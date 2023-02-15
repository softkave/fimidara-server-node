import * as Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types';
import {endpointValidationSchemas} from '../../validation';
import {
  IGetWorkspaceProgramAccessTokensEndpointParams,
  IGetWorkspaceProgramAccessTokensEndpointParamsBase,
} from './types';

export const getWorkspaceProgramAccessTokenBaseJoiSchemaParts: JoiSchemaParts<IGetWorkspaceProgramAccessTokensEndpointParamsBase> =
  endpointValidationSchemas.optionalWorkspaceIdParts;

export const getWorkspaceProgramAccessTokenJoiSchema =
  Joi.object<IGetWorkspaceProgramAccessTokensEndpointParams>()
    .keys({
      ...getWorkspaceProgramAccessTokenBaseJoiSchemaParts,
      ...endpointValidationSchemas.paginationParts,
    })
    .required();
