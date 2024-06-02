import Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types.js';
import {endpointValidationSchemas} from '../../validation.js';
import {
  GetWorkspaceCollaborationRequestsEndpointParams,
  GetWorkspaceCollaborationRequestsEndpointParamsBase,
} from './types.js';

export const getWorkspaceCollaborationRequestsBaseJoiSchemaParts: JoiSchemaParts<GetWorkspaceCollaborationRequestsEndpointParamsBase> =
  endpointValidationSchemas.optionalWorkspaceIdParts;

export const getWorkspaceCollaborationRequestsJoiSchema =
  Joi.object<GetWorkspaceCollaborationRequestsEndpointParams>()
    .keys({
      ...getWorkspaceCollaborationRequestsBaseJoiSchemaParts,
      ...endpointValidationSchemas.paginationParts,
    })
    .required();
