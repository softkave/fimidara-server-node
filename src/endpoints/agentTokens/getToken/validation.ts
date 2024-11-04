import Joi from 'joi';
import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {GetAgentTokenEndpointParams} from './types.js';

export const getAgentTokenJoiSchema =
  startJoiObject<GetAgentTokenEndpointParams>({
    ...endpointValidationSchemas.workspaceResourceParts,
    tokenId: kValidationSchemas.resourceId,
    shouldEncode: Joi.boolean().default(false),
  }).required();
