import * as Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types';
import {endpointValidationSchemas} from '../../validation';
import {
  GetWorkspaceCollaboratorsEndpointParams,
  GetWorkspaceCollaboratorsEndpointParamsBase,
} from './types';

export const getWorkspaceCollaboratorsBaseJoiSchemaParts: JoiSchemaParts<GetWorkspaceCollaboratorsEndpointParamsBase> =
  endpointValidationSchemas.optionalWorkspaceIdParts;

export const getWorkspaceCollaboratorsJoiSchema =
  Joi.object<GetWorkspaceCollaboratorsEndpointParams>()
    .keys({
      ...endpointValidationSchemas.paginationParts,
      ...getWorkspaceCollaboratorsBaseJoiSchemaParts,
    })
    .required();
