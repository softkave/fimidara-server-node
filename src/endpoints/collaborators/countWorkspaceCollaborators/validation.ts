import * as Joi from 'joi';
import {getWorkspaceCollaboratorsBaseJoiSchemaParts} from '../getWorkspaceCollaborators/validation';
import {CountWorkspaceCollaboratorsEndpointParams} from './types';

export const countWorkspaceCollaboratorsJoiSchema =
  Joi.object<CountWorkspaceCollaboratorsEndpointParams>()
    .keys(getWorkspaceCollaboratorsBaseJoiSchemaParts)
    .required();
