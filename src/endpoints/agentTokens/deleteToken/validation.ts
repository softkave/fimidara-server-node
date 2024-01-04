import * as Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import agentTokenValidationSchemas from '../validation';

export const deleteAgentTokenJoiSchema = Joi.object()
  .keys({
    ...endpointValidationSchemas.workspaceResourceParts,
    tokenId: kValidationSchemas.resourceId,
    onReferenced: agentTokenValidationSchemas.onReferenced,
  })
  .required();
