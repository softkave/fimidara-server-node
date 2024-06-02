import Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types.js';
import {endpointValidationSchemas} from '../../validation.js';
import {
  GetWorkspaceCollaboratorsEndpointParams,
  GetWorkspaceCollaboratorsEndpointParamsBase,
} from './types.js';

export const getWorkspaceCollaboratorsBaseJoiSchemaParts: JoiSchemaParts<GetWorkspaceCollaboratorsEndpointParamsBase> =
  endpointValidationSchemas.optionalWorkspaceIdParts;

export const getWorkspaceCollaboratorsJoiSchema =
  Joi.object<GetWorkspaceCollaboratorsEndpointParams>()
    .keys({
      ...endpointValidationSchemas.paginationParts,
      ...getWorkspaceCollaboratorsBaseJoiSchemaParts,
    })
    .required();
