import * as Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types';
import {endpointValidationSchemas} from '../../validation';
import {
  GetFileBackendMountsEndpointParams,
  GetFileBackendMountsEndpointParamsBase,
} from './types';

export const getWorkspaceFileBackendMountBaseJoiSchemaParts: JoiSchemaParts<GetFileBackendMountsEndpointParamsBase> =
  endpointValidationSchemas.optionalWorkspaceIdParts;

export const getWorkspaceFileBackendMountJoiSchema =
  Joi.object<GetFileBackendMountsEndpointParams>()
    .keys({
      ...getWorkspaceFileBackendMountBaseJoiSchemaParts,
      ...endpointValidationSchemas.paginationParts,
    })
    .required();
