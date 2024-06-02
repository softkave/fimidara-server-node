import Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types.js';
import {endpointValidationSchemas} from '../../validation.js';
import fileBackendValidationSchemas from '../validation.js';
import {
  GetFileBackendConfigsEndpointParams,
  GetFileBackendConfigsEndpointParamsBase,
} from './types.js';

export const getFileBackendConfigsBaseJoiSchemaParts: JoiSchemaParts<GetFileBackendConfigsEndpointParamsBase> =
  {
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    backend: fileBackendValidationSchemas.backend,
  };

export const getFileBackendConfigsJoiSchema =
  Joi.object<GetFileBackendConfigsEndpointParams>()
    .keys({
      ...getFileBackendConfigsBaseJoiSchemaParts,
      ...endpointValidationSchemas.paginationParts,
    })
    .required();
