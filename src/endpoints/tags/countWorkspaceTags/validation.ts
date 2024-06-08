import Joi from 'joi';
import {getWorkspaceTagBaseJoiSchemaParts} from '../getWorkspaceTags/validation.js';
import {CountWorkspaceTagsEndpointParams} from './types.js';

export const countWorkspaceTagJoiSchema =
  Joi.object<CountWorkspaceTagsEndpointParams>()
    .keys(getWorkspaceTagBaseJoiSchemaParts)
    .required();
