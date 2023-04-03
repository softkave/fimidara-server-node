import * as Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types';
import {endpointValidationSchemas} from '../../validation';
import permissionItemValidationSchemas from '../validation';
import {
  IGetResourcePermissionItemsEndpointParams,
  IGetResourcePermissionItemsEndpointParamsBase,
} from './types';

export const getResourcePermissionItemsBaseJoiSchemaParts: JoiSchemaParts<IGetResourcePermissionItemsEndpointParamsBase> =
  {
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    target: permissionItemValidationSchemas.target.required(),
  };

export const getResourcePermissionItemsJoiSchema =
  Joi.object<IGetResourcePermissionItemsEndpointParams>()
    .keys({
      ...getResourcePermissionItemsBaseJoiSchemaParts,
      ...endpointValidationSchemas.paginationParts,
    })
    .required();
