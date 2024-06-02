import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import agentTokenValidationSchemas from '../validation.js';

export const deleteAgentTokenJoiSchema = Joi.object()
  .keys({
    ...endpointValidationSchemas.workspaceResourceParts,
    tokenId: kValidationSchemas.resourceId,
    onReferenced: agentTokenValidationSchemas.onReferenced,
  })
  .required();
