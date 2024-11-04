import {startJoiObject} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {GetCollaboratorsWithoutPermissionEndpointParams} from './types.js';

export const getCollaboratorsWithoutPermissionBaseJoiSchemaParts =
  endpointValidationSchemas.optionalWorkspaceIdParts;

export const getCollaboratorsWithoutPermissionJoiSchema =
  startJoiObject<GetCollaboratorsWithoutPermissionEndpointParams>(
    getCollaboratorsWithoutPermissionBaseJoiSchemaParts
  ).required();
