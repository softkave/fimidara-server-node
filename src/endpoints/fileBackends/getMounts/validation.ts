import * as Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types';
import {validationSchemas} from '../../../utils/validationUtils';
import folderValidationSchemas from '../../folders/validation';
import {endpointValidationSchemas} from '../../validation';
import fileBackendValidationSchemas from '../validation';
import {
  GetFileBackendMountsEndpointParams,
  GetFileBackendMountsEndpointParamsBase,
} from './types';

export const getFileBackendMountsBaseJoiSchemaParts: JoiSchemaParts<GetFileBackendMountsEndpointParamsBase> =
  {
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    folderpath: folderValidationSchemas.folderpath.required(),
    backend: fileBackendValidationSchemas.backend.required(),
    configId: validationSchemas.resourceId.allow(null),
  };

export const getFileBackendMountsJoiSchema =
  Joi.object<GetFileBackendMountsEndpointParams>()
    .keys({
      ...getFileBackendMountsBaseJoiSchemaParts,
      ...endpointValidationSchemas.paginationParts,
    })
    .required();
