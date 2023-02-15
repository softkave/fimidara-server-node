import * as Joi from 'joi';
import {getResourcePermissionItemsBaseJoiSchemaParts} from '../getResourcePermissionItems/validation';
import {ICountResourcePermissionItemsEndpointParams} from './types';

export const countResourcePermissionItemsJoiSchema =
  Joi.object<ICountResourcePermissionItemsEndpointParams>()
    .keys(getResourcePermissionItemsBaseJoiSchemaParts)
    .required();
