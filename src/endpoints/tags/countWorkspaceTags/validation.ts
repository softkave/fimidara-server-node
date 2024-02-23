import * as Joi from 'joi';
import {getWorkspaceTagBaseJoiSchemaParts} from '../getWorkspaceTags/validation';
import {CountWorkspaceTagsEndpointParams} from './types';

export const countWorkspaceTagJoiSchema = Joi.object<CountWorkspaceTagsEndpointParams>()
  .keys(getWorkspaceTagBaseJoiSchemaParts)
  .required();
