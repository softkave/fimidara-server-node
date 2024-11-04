import {StrictSchemaMap} from 'joi';
import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import folderValidationSchemas from '../../folders/validation.js';
import {endpointValidationSchemas} from '../../validation.js';
import fileBackendValidationSchemas from '../validation.js';
import {
  GetFileBackendMountsEndpointParams,
  GetFileBackendMountsEndpointParamsBase,
} from './types.js';

export const getFileBackendMountsBaseJoiSchemaParts: StrictSchemaMap<GetFileBackendMountsEndpointParamsBase> =
  {
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    folderpath: folderValidationSchemas.folderpath,
    backend: fileBackendValidationSchemas.backend,
    configId: kValidationSchemas.resourceId,
  };

export const getFileBackendMountsJoiSchema =
  startJoiObject<GetFileBackendMountsEndpointParams>({
    ...getFileBackendMountsBaseJoiSchemaParts,
    ...endpointValidationSchemas.paginationParts,
  }).required();
