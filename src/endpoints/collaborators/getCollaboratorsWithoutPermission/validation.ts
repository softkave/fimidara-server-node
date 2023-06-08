import * as Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types';
import {endpointValidationSchemas} from '../../validation';
import {
  GetCollaboratorsWithoutPermissionEndpointParams,
  GetCollaboratorsWithoutPermissionEndpointParamsBase,
} from './types';

export const getCollaboratorsWithoutPermissionBaseJoiSchemaParts: JoiSchemaParts<GetCollaboratorsWithoutPermissionEndpointParamsBase> =
  endpointValidationSchemas.optionalWorkspaceIdParts;

export const getCollaboratorsWithoutPermissionJoiSchema =
  Joi.object<GetCollaboratorsWithoutPermissionEndpointParams>()
    .keys({
      ...getCollaboratorsWithoutPermissionBaseJoiSchemaParts,
    })
    .required();
