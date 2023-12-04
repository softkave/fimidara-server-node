import * as Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types';
import {endpointValidationSchemas} from '../../validation';
import {ResolveMountsEndpointParams, ResolveMountsEndpointParamsBase} from './types';

export const getWorkspaceFileBackendMountBaseJoiSchemaParts: JoiSchemaParts<ResolveMountsEndpointParamsBase> =
  endpointValidationSchemas.optionalWorkspaceIdParts;

export const getWorkspaceFileBackendMountJoiSchema =
  Joi.object<ResolveMountsEndpointParams>()
    .keys({
      ...getWorkspaceFileBackendMountBaseJoiSchemaParts,
      ...endpointValidationSchemas.paginationParts,
    })
    .required();
