import Joi from 'joi';
import {getWorkspaceCollaborationRequestsBaseJoiSchemaParts} from '../getWorkspaceRequests/validation.js';
import {CountWorkspaceCollaborationRequestsEndpointParams} from './types.js';

export const countWorkspaceCollaborationRequestsJoiSchema =
  Joi.object<CountWorkspaceCollaborationRequestsEndpointParams>()
    .keys(getWorkspaceCollaborationRequestsBaseJoiSchemaParts)
    .required();
