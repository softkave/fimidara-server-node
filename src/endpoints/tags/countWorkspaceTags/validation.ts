import * as Joi from 'joi';
import {getWorkspaceTagBaseJoiSchemaParts} from '../getWorkspaceTags/validation';
import {ICountWorkspaceTagsEndpointParams} from './types';

export const countWorkspaceTagJoiSchema = Joi.object<ICountWorkspaceTagsEndpointParams>()
  .keys(getWorkspaceTagBaseJoiSchemaParts)
  .required();
