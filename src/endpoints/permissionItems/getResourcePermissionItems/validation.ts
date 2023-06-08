import * as Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types';
import {endpointValidationSchemas} from '../../validation';
import permissionItemValidationSchemas from '../validation';
import {
  GetResourcePermissionItemsEndpointParams,
  GetResourcePermissionItemsEndpointParamsBase,
} from './types';

export const getResourcePermissionItemsBaseJoiSchemaParts: JoiSchemaParts<GetResourcePermissionItemsEndpointParamsBase> =
  {
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    target: permissionItemValidationSchemas.target.required(),
  };

export const getResourcePermissionItemsJoiSchema =
  Joi.object<GetResourcePermissionItemsEndpointParams>()
    .keys({
      ...getResourcePermissionItemsBaseJoiSchemaParts,
      ...endpointValidationSchemas.paginationParts,
    })
    .required();
