import * as Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import agentTokenValidationSchemas from '../validation';
import {GetAgentTokenEndpointParams} from './types';

export const getAgentTokenJoiSchema = Joi.object<GetAgentTokenEndpointParams>()
  .keys({
    ...endpointValidationSchemas.workspaceResourceParts,
    tokenId: kValidationSchemas.resourceId,
    onReferenced: agentTokenValidationSchemas.onReferenced,
  })
  .required();
