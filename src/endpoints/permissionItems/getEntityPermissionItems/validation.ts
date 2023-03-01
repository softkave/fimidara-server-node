import * as Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types';
import {validationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import {
  IGetEntityPermissionItemsEndpointParams,
  IGetEntityPermissionItemsEndpointParamsBase,
} from './types';

export const getEntityPermissionItemsBaseJoiSchemaParts: JoiSchemaParts<IGetEntityPermissionItemsEndpointParamsBase> =
  {
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    entityId: validationSchemas.resourceId.required(),
  };

export const getEntityPermissionItemsJoiSchema =
  Joi.object<IGetEntityPermissionItemsEndpointParams>()
    .keys({
      ...getEntityPermissionItemsBaseJoiSchemaParts,
      ...endpointValidationSchemas.paginationParts,
    })
    .required();
