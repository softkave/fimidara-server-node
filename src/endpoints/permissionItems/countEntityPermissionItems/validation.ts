import * as Joi from 'joi';
import {getEntityPermissionItemsBaseJoiSchemaParts} from '../getEntityPermissionItems/validation';
import {CountEntityPermissionItemsEndpointParams} from './types';

export const countEntityPermissionItemsJoiSchema =
  Joi.object<CountEntityPermissionItemsEndpointParams>()
    .keys(getEntityPermissionItemsBaseJoiSchemaParts)
    .required();
