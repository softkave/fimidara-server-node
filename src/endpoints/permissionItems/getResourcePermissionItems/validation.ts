import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import {IGetResourcePermissionItemsEndpointParams} from './types';

export const getResourcePermissionItemsJoiSchema = Joi.object<IGetResourcePermissionItemsEndpointParams>()
  .keys({
    workspaceId: validationSchemas.resourceId,
    targetId: validationSchemas.resourceId.allow(null),
    targetType: validationSchemas.resourceType.required(),
    containerId: validationSchemas.resourceId.allow(null),
    containerType: validationSchemas.resourceType.allow(null),
    page: endpointValidationSchemas.page,
    pageSize: endpointValidationSchemas.pageSize,
  })
  .required();
