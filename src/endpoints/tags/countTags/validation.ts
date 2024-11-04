import Joi from 'joi';
import {getTagsBaseJoiSchemaParts} from '../getTags/validation.js';
import {CountTagsEndpointParams} from './types.js';

export const countTagsJoiSchema = Joi.object<CountTagsEndpointParams>()
  .keys(getTagsBaseJoiSchemaParts)
  .required();
