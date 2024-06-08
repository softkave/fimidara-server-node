import Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types.js';
import {endpointValidationSchemas} from '../../validation.js';
import {
  GetWorkspaceTagsEndpointParams,
  GetWorkspaceTagsEndpointParamsBase,
} from './types.js';

export const getWorkspaceTagBaseJoiSchemaParts: JoiSchemaParts<GetWorkspaceTagsEndpointParamsBase> =
  endpointValidationSchemas.optionalWorkspaceIdParts;

export const getWorkspaceTagJoiSchema =
  Joi.object<GetWorkspaceTagsEndpointParams>()
    .keys({
      ...getWorkspaceTagBaseJoiSchemaParts,
      ...endpointValidationSchemas.paginationParts,
    })
    .required();
