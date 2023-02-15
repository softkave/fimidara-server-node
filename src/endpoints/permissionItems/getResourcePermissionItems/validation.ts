import * as Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types';
import {validationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import {
  IGetResourcePermissionItemsEndpointParams,
  IGetResourcePermissionItemsEndpointParamsBase,
} from './types';

export const getResourcePermissionItemsBaseJoiSchemaParts: JoiSchemaParts<IGetResourcePermissionItemsEndpointParamsBase> =
  {
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    targetId: validationSchemas.resourceId.allow(null),
    targetType: validationSchemas.resourceType.required(),
    containerId: validationSchemas.resourceId.allow(null),
    containerType: validationSchemas.resourceType.allow(null),
  };

export const getResourcePermissionItemsJoiSchema =
  Joi.object<IGetResourcePermissionItemsEndpointParams>()
    .keys({
      ...getResourcePermissionItemsBaseJoiSchemaParts,
      ...endpointValidationSchemas.paginationParts,
    })
    .required();
