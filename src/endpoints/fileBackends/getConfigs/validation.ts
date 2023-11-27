import * as Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types';
import {endpointValidationSchemas} from '../../validation';
import {
  GetFileBackendConfigsEndpointParams,
  GetFileBackendConfigsEndpointParamsBase,
} from './types';

export const getWorkspaceFileBackendConfigBaseJoiSchemaParts: JoiSchemaParts<GetFileBackendConfigsEndpointParamsBase> =
  endpointValidationSchemas.optionalWorkspaceIdParts;

export const getWorkspaceFileBackendConfigJoiSchema =
  Joi.object<GetFileBackendConfigsEndpointParams>()
    .keys({
      ...getWorkspaceFileBackendConfigBaseJoiSchemaParts,
      ...endpointValidationSchemas.paginationParts,
    })
    .required();
