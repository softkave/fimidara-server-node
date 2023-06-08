import * as Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types';
import {validationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import {
  GetEntityPermissionItemsEndpointParams,
  GetEntityPermissionItemsEndpointParamsBase,
} from './types';

export const getEntityPermissionItemsBaseJoiSchemaParts: JoiSchemaParts<GetEntityPermissionItemsEndpointParamsBase> =
  {
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    entityId: validationSchemas.resourceId.required(),
  };

export const getEntityPermissionItemsJoiSchema =
  Joi.object<GetEntityPermissionItemsEndpointParams>()
    .keys({
      ...getEntityPermissionItemsBaseJoiSchemaParts,
      ...endpointValidationSchemas.paginationParts,
    })
    .required();
