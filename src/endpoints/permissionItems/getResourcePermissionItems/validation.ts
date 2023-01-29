import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import {IGetResourcePermissionItemsEndpointParams} from './types';

export const getResourcePermissionItemsJoiSchema = Joi.object<IGetResourcePermissionItemsEndpointParams>()
  .keys({
    workspaceId: validationSchemas.resourceId,
    itemResourceId: validationSchemas.resourceId.allow(null),
    itemResourceType: validationSchemas.resourceType.required(),
    permissionOwnerId: validationSchemas.resourceId.allow(null),
    permissionOwnerType: validationSchemas.resourceType.allow(null),
    page: endpointValidationSchemas.page,
    pageSize: endpointValidationSchemas.pageSize,
  })
  .required();
