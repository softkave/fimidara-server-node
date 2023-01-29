import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import {IGetWorkspaceCollaborationRequestsEndpointParams} from './types';

export const getWorkspaceCollaborationRequestsJoiSchema = Joi.object<IGetWorkspaceCollaborationRequestsEndpointParams>()
  .keys({
    workspaceId: validationSchemas.resourceId,
    page: endpointValidationSchemas.page,
    pageSize: endpointValidationSchemas.pageSize,
  })
  .required();
