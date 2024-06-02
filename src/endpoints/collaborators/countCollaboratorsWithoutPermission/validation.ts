import Joi from 'joi';
import {getWorkspaceCollaboratorsBaseJoiSchemaParts} from '../getWorkspaceCollaborators/validation.js';
import {CountCollaboratorsWithoutPermissionEndpointParams} from './types.js';

export const countCollaboratorsWithoutPermissionJoiSchema =
  Joi.object<CountCollaboratorsWithoutPermissionEndpointParams>()
    .keys(getWorkspaceCollaboratorsBaseJoiSchemaParts)
    .required();
