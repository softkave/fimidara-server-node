import * as Joi from 'joi';
import {getWorkspaceCollaborationRequestsBaseJoiSchemaParts} from '../getWorkspaceRequests/validation';
import {CountWorkspaceCollaborationRequestsEndpointParams} from './types';

export const countWorkspaceCollaborationRequestsJoiSchema =
  Joi.object<CountWorkspaceCollaborationRequestsEndpointParams>()
    .keys(getWorkspaceCollaborationRequestsBaseJoiSchemaParts)
    .required();
