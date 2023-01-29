import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import {IGetWorkspacePermissionGroupsEndpointParams} from './types';

export const getWorkspacePermissionGroupsJoiSchema = Joi.object<IGetWorkspacePermissionGroupsEndpointParams>()
  .keys({
    workspaceId: validationSchemas.resourceId,
    page: endpointValidationSchemas.page,
    pageSize: endpointValidationSchemas.pageSize,
  })
  .required();
