import Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types.js';
import {endpointValidationSchemas} from '../../validation.js';
import {
  GetCollaboratorsWithoutPermissionEndpointParams,
  GetCollaboratorsWithoutPermissionEndpointParamsBase,
} from './types.js';

export const getCollaboratorsWithoutPermissionBaseJoiSchemaParts: JoiSchemaParts<GetCollaboratorsWithoutPermissionEndpointParamsBase> =
  endpointValidationSchemas.optionalWorkspaceIdParts;

export const getCollaboratorsWithoutPermissionJoiSchema =
  Joi.object<GetCollaboratorsWithoutPermissionEndpointParams>()
    .keys({
      ...getCollaboratorsWithoutPermissionBaseJoiSchemaParts,
    })
    .required();
