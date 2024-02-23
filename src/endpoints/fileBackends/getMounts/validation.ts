import * as Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types';
import {kValidationSchemas} from '../../../utils/validationUtils';
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
