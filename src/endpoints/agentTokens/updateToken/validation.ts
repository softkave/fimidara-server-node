import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import kAgentTokenValidationSchemas from '../validation.js';
import {UpdateAgentTokenEndpointParams} from './types.js';

export const updateAgentTokenJoiSchema =
  Joi.object<UpdateAgentTokenEndpointParams>()
    .keys({
      ...endpointValidationSchemas.workspaceResourceParts,
      tokenId: kValidationSchemas.resourceId,
      onReferenced: kAgentTokenValidationSchemas.onReferenced,
      token: Joi.object<UpdateAgentTokenEndpointParams['token']>()
        .keys({
          expiresAt: kValidationSchemas.time.allow(null),
          providedResourceId: kValidationSchemas.providedResourceId.allow(null),
          name: kValidationSchemas.name.allow(null),
          description: kValidationSchemas.description.allow(null),
        })
        .required(),
      shouldEncode: Joi.boolean().default(false),
    })
    .required();
