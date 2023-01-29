import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import {IGetWorkspaceClientAssignedTokensEndpointParams} from './types';

export const getWorkspaceClientAssignedTokenJoiSchema = Joi.object<IGetWorkspaceClientAssignedTokensEndpointParams>()
  .keys({
    workspaceId: validationSchemas.resourceId,
    page: endpointValidationSchemas.page,
    pageSize: endpointValidationSchemas.pageSize,
  })
  .required();
