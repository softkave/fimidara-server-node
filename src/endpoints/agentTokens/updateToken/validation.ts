import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import {UpdateAgentTokenEndpointParams} from './types';
import agentTokenValidationSchemas from '../validation';

export const updateAgentTokenJoiSchema = Joi.object<UpdateAgentTokenEndpointParams>()
  .keys({
    ...endpointValidationSchemas.workspaceResourceParts,
    tokenId: validationSchemas.resourceId,
    onReferenced: agentTokenValidationSchemas.onReferenced,
    token: Joi.object<UpdateAgentTokenEndpointParams['token']>()
      .keys({
        expires: validationSchemas.time.allow(null),
        providedResourceId: validationSchemas.providedResourceId.allow(null),
        name: validationSchemas.name.allow(null),
        description: validationSchemas.description.allow(null),
      })
      .required(),
  })
  .required();
