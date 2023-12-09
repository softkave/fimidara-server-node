import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import agentTokenValidationSchemas from '../validation';

export const deleteAgentTokenJoiSchema = Joi.object()
  .keys({
    ...endpointValidationSchemas.workspaceResourceParts,
    tokenId: validationSchemas.resourceId,
    onReferenced: agentTokenValidationSchemas.onReferenced,
  })
  .required();
