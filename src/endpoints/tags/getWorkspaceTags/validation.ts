import * as Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types';
import {endpointValidationSchemas} from '../../validation';
import {GetWorkspaceTagsEndpointParams, GetWorkspaceTagsEndpointParamsBase} from './types';

export const getWorkspaceTagBaseJoiSchemaParts: JoiSchemaParts<GetWorkspaceTagsEndpointParamsBase> =
  endpointValidationSchemas.optionalWorkspaceIdParts;

export const getWorkspaceTagJoiSchema = Joi.object<GetWorkspaceTagsEndpointParams>()
  .keys({
    ...getWorkspaceTagBaseJoiSchemaParts,
    ...endpointValidationSchemas.paginationParts,
  })
  .required();
