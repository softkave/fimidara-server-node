import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import kAgentTokenValidationSchemas from '../validation.js';
import {EncodeAgentTokenEndpointParams} from './types.js';

export const encodeAgentTokenJoiSchema =
  Joi.object<EncodeAgentTokenEndpointParams>()
    .keys({
      ...endpointValidationSchemas.workspaceResourceParts,
      tokenId: kValidationSchemas.resourceId,
      onReferenced: kAgentTokenValidationSchemas.onReferenced,
    })
    .required();
