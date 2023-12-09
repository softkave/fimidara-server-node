import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import {GetAgentTokenEndpointParams} from './types';
import agentTokenValidationSchemas from '../validation';

export const getAgentTokenJoiSchema = Joi.object<GetAgentTokenEndpointParams>()
  .keys({
    ...endpointValidationSchemas.workspaceResourceParts,
    tokenId: validationSchemas.resourceId,
    onReferenced: agentTokenValidationSchemas.onReferenced,
  })
  .required();
