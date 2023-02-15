import * as Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types';
import {endpointValidationSchemas} from '../../validation';
import {IGetWorkspaceTagsEndpointParams, IGetWorkspaceTagsEndpointParamsBase} from './types';

export const getWorkspaceTagBaseJoiSchemaParts: JoiSchemaParts<IGetWorkspaceTagsEndpointParamsBase> =
  endpointValidationSchemas.optionalWorkspaceIdParts;

export const getWorkspaceTagJoiSchema = Joi.object<IGetWorkspaceTagsEndpointParams>()
  .keys({
    ...getWorkspaceTagBaseJoiSchemaParts,
    ...endpointValidationSchemas.paginationParts,
  })
  .required();
