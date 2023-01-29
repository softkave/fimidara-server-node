import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import {IGetEntityAssignedPermissionGroupsEndpointParams} from './types';

export const getEntityAssignedPermissionGroupsJoiSchema = Joi.object<IGetEntityAssignedPermissionGroupsEndpointParams>()
  .keys({
    workspaceId: validationSchemas.resourceId,
    page: endpointValidationSchemas.page,
    pageSize: endpointValidationSchemas.pageSize,
  })
  .required();
