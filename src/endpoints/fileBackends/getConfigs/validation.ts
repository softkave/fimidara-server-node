import * as Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types';
import {endpointValidationSchemas} from '../../validation';
import fileBackendValidationSchemas from '../validation';
import {
  GetFileBackendConfigsEndpointParams,
  GetFileBackendConfigsEndpointParamsBase,
} from './types';

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
