import Joi from 'joi';
import {getWorkspaceTagBaseJoiSchemaParts} from '../getTags/validation.js';
import {CountTagsEndpointParams} from './types.js';

export const countWorkspaceTagJoiSchema = Joi.object<CountTagsEndpointParams>()
  .keys(getWorkspaceTagBaseJoiSchemaParts)
  .required();
