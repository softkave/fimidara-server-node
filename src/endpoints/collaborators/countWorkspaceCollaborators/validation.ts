import Joi from 'joi';
import {getWorkspaceCollaboratorsBaseJoiSchemaParts} from '../getWorkspaceCollaborators/validation.js';
import {CountWorkspaceCollaboratorsEndpointParams} from './types.js';

export const countWorkspaceCollaboratorsJoiSchema =
  Joi.object<CountWorkspaceCollaboratorsEndpointParams>()
    .keys(getWorkspaceCollaboratorsBaseJoiSchemaParts)
    .required();
