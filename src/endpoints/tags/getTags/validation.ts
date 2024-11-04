import {StrictSchemaMap} from 'joi';
import {startJoiObject} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {GetTagsEndpointParams, GetTagsEndpointParamsBase} from './types.js';

export const getTagsBaseJoiSchemaParts: StrictSchemaMap<GetTagsEndpointParamsBase> =
  endpointValidationSchemas.optionalWorkspaceIdParts;

export const getTagsJoiSchema = startJoiObject<GetTagsEndpointParams>({
  ...getTagsBaseJoiSchemaParts,
  ...endpointValidationSchemas.paginationParts,
}).required();
