import * as Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types';
import {endpointValidationSchemas} from '../../validation';
import {
  ResolveFileBackendMountssEndpointParams,
  ResolveMountsEndpointParamsBase,
} from './types';

export const resolveWorkspaceFileBackendMountBaseJoiSchemaParts: JoiSchemaParts<ResolveMountsEndpointParamsBase> =
  endpointValidationSchemas.optionalWorkspaceIdParts;

export const resolveWorkspaceFileBackendMountJoiSchema =
  Joi.object<ResolveFileBackendMountssEndpointParams>()
    .keys({
      ...resolveWorkspaceFileBackendMountBaseJoiSchemaParts,
      ...endpointValidationSchemas.paginationParts,
    })
    .required();
