import * as Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types';
import {endpointValidationSchemas} from '../../validation';
import {
  GetWorkspaceCollaborationRequestsEndpointParams,
  GetWorkspaceCollaborationRequestsEndpointParamsBase,
} from './types';

export const getWorkspaceCollaborationRequestsBaseJoiSchemaParts: JoiSchemaParts<GetWorkspaceCollaborationRequestsEndpointParamsBase> =
  endpointValidationSchemas.optionalWorkspaceIdParts;

export const getWorkspaceCollaborationRequestsJoiSchema =
  Joi.object<GetWorkspaceCollaborationRequestsEndpointParams>()
    .keys({
      ...getWorkspaceCollaborationRequestsBaseJoiSchemaParts,
      ...endpointValidationSchemas.paginationParts,
    })
    .required();
