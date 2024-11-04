import Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types.js';
import {endpointValidationSchemas} from '../../validation.js';
import {GetTagsEndpointParams, GetTagsEndpointParamsBase} from './types.js';

export const getWorkspaceTagBaseJoiSchemaParts: JoiSchemaParts<GetTagsEndpointParamsBase> =
  endpointValidationSchemas.optionalWorkspaceIdParts;

export const getWorkspaceTagJoiSchema = Joi.object<GetTagsEndpointParams>()
  .keys({
    ...getWorkspaceTagBaseJoiSchemaParts,
    ...endpointValidationSchemas.paginationParts,
  })
  .required();
