import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import kAgentTokenValidationSchemas from '../validation.js';
import {GetAgentTokenEndpointParams} from './types.js';

export const getAgentTokenJoiSchema = Joi.object<GetAgentTokenEndpointParams>()
  .keys({
    ...endpointValidationSchemas.workspaceResourceParts,
    tokenId: kValidationSchemas.resourceId,
    onReferenced: kAgentTokenValidationSchemas.onReferenced,
    shouldEncode: Joi.boolean().default(false),
  })
  .required();
