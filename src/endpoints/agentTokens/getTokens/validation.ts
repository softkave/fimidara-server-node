import Joi from 'joi';
import {startJoiObject} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {GetAgentTokensEndpointParams} from './types.js';

export const getAgentTokenBaseJoiSchemaParts =
  endpointValidationSchemas.optionalWorkspaceIdParts;

export const getAgentTokenJoiSchema =
  startJoiObject<GetAgentTokensEndpointParams>({
    ...getAgentTokenBaseJoiSchemaParts,
    ...endpointValidationSchemas.paginationParts,
    shouldEncode: Joi.boolean().default(false),
  }).required();
