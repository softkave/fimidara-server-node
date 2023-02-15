import * as Joi from 'joi';
import {getEntityPermissionItemsBaseJoiSchemaParts} from '../getEntityPermissionItems/validation';
import {ICountEntityPermissionItemsEndpointParams} from './types';

export const countEntityPermissionItemsJoiSchema =
  Joi.object<ICountEntityPermissionItemsEndpointParams>()
    .keys(getEntityPermissionItemsBaseJoiSchemaParts)
    .required();
