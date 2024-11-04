import {StrictSchemaMap} from 'joi';
import {startJoiObject} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import fileBackendValidationSchemas from '../validation.js';
import {
  GetFileBackendConfigsEndpointParams,
  GetFileBackendConfigsEndpointParamsBase,
} from './types.js';

export const getFileBackendConfigsBaseJoiSchemaParts: StrictSchemaMap<GetFileBackendConfigsEndpointParamsBase> =
  {
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    backend: fileBackendValidationSchemas.backend,
  };

export const getFileBackendConfigsJoiSchema =
  startJoiObject<GetFileBackendConfigsEndpointParams>({
    ...getFileBackendConfigsBaseJoiSchemaParts,
    ...endpointValidationSchemas.paginationParts,
  }).required();
