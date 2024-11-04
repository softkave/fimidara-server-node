import Joi from 'joi';
import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {UpdateAgentTokenEndpointParams} from './types.js';

export const updateAgentTokenJoiSchema =
  startJoiObject<UpdateAgentTokenEndpointParams>({
    ...endpointValidationSchemas.workspaceResourceParts,
    tokenId: kValidationSchemas.resourceId,
    token: startJoiObject<UpdateAgentTokenEndpointParams['token']>({
      expiresAt: kValidationSchemas.time.allow(null),
      providedResourceId: kValidationSchemas.providedResourceId.allow(null),
      name: kValidationSchemas.name.allow(null),
      description: kValidationSchemas.description.allow(null),
    }).required(),
    shouldEncode: Joi.boolean().default(false),
  }).required();
