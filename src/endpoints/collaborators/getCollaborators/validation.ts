import Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types.js';
import {endpointValidationSchemas} from '../../validation.js';
import {
  GetCollaboratorsEndpointParams,
  GetCollaboratorsEndpointParamsBase,
} from './types.js';

export const getCollaboratorsBaseJoiSchemaParts: JoiSchemaParts<GetCollaboratorsEndpointParamsBase> =
  endpointValidationSchemas.optionalWorkspaceIdParts;

export const getCollaboratorsJoiSchema =
  Joi.object<GetCollaboratorsEndpointParams>()
    .keys({
      ...endpointValidationSchemas.paginationParts,
      ...getCollaboratorsBaseJoiSchemaParts,
    })
    .required();
