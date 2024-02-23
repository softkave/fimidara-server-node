import * as Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import agentTokenValidationSchemas from '../validation';
import {UpdateAgentTokenEndpointParams} from './types';

export const updateAgentTokenJoiSchema = Joi.object<UpdateAgentTokenEndpointParams>()
  .keys({
    ...endpointValidationSchemas.workspaceResourceParts,
    tokenId: kValidationSchemas.resourceId,
    onReferenced: agentTokenValidationSchemas.onReferenced,
    token: Joi.object<UpdateAgentTokenEndpointParams['token']>()
      .keys({
        expires: kValidationSchemas.time.allow(null),
        providedResourceId: kValidationSchemas.providedResourceId.allow(null),
        name: kValidationSchemas.name.allow(null),
        description: kValidationSchemas.description.allow(null),
      })
      .required(),
  })
  .required();
