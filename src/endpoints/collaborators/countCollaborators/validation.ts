import Joi from 'joi';
import {getWorkspaceCollaboratorsBaseJoiSchemaParts} from '../getCollaborators/validation.js';
import {CountCollaboratorsEndpointParams} from './types.js';

export const countCollaboratorsJoiSchema =
  Joi.object<CountCollaboratorsEndpointParams>()
    .keys(getWorkspaceCollaboratorsBaseJoiSchemaParts)
    .required();
