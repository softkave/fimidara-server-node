import * as Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types';
import {endpointValidationSchemas} from '../../validation';
import {
  IGetWorkspaceCollaborationRequestsEndpointParams,
  IGetWorkspaceCollaborationRequestsEndpointParamsBase,
} from './types';

export const getWorkspaceCollaborationRequestsBaseJoiSchemaParts: JoiSchemaParts<IGetWorkspaceCollaborationRequestsEndpointParamsBase> =
  endpointValidationSchemas.optionalWorkspaceIdParts;

export const getWorkspaceCollaborationRequestsJoiSchema =
  Joi.object<IGetWorkspaceCollaborationRequestsEndpointParams>()
    .keys({
      ...getWorkspaceCollaborationRequestsBaseJoiSchemaParts,
      ...endpointValidationSchemas.paginationParts,
    })
    .required();
