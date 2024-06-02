import Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types.js';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import folderValidationSchemas from '../../folders/validation.js';
import {endpointValidationSchemas} from '../../validation.js';
import fileBackendValidationSchemas from '../validation.js';
import {
  GetFileBackendMountsEndpointParams,
  GetFileBackendMountsEndpointParamsBase,
} from './types.js';

export const getFileBackendMountsBaseJoiSchemaParts: JoiSchemaParts<GetFileBackendMountsEndpointParamsBase> =
  {
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    folderpath: folderValidationSchemas.folderpath,
    backend: fileBackendValidationSchemas.backend,
    configId: kValidationSchemas.resourceId,
  };

export const getFileBackendMountsJoiSchema =
  Joi.object<GetFileBackendMountsEndpointParams>()
    .keys({
      ...getFileBackendMountsBaseJoiSchemaParts,
      ...endpointValidationSchemas.paginationParts,
    })
    .required();
