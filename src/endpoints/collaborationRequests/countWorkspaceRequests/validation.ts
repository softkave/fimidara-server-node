import * as Joi from 'joi';
import {getWorkspaceCollaborationRequestsBaseJoiSchemaParts} from '../getWorkspaceRequests/validation';
import {ICountWorkspaceCollaborationRequestsEndpointParams} from './types';

export const countWorkspaceCollaborationRequestsJoiSchema =
  Joi.object<ICountWorkspaceCollaborationRequestsEndpointParams>()
    .keys(getWorkspaceCollaborationRequestsBaseJoiSchemaParts)
    .required();
