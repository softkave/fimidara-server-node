import * as Joi from 'joi';
import {getWorkspaceCollaboratorsBaseJoiSchemaParts} from '../getWorkspaceCollaborators/validation';
import {CountCollaboratorsWithoutPermissionEndpointParams} from './types';

export const countCollaboratorsWithoutPermissionJoiSchema =
  Joi.object<CountCollaboratorsWithoutPermissionEndpointParams>()
    .keys(getWorkspaceCollaboratorsBaseJoiSchemaParts)
    .required();
