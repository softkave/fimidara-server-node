import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import kAgentTokenValidationSchemas from '../validation.js';
import {AddAgentTokenEndpointParams} from './types.js';

export const addAgentTokenJoiSchema = Joi.object<AddAgentTokenEndpointParams>()
  .keys({
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    expiresAt: kValidationSchemas.time.allow(null),
    providedResourceId: kValidationSchemas.providedResourceId.allow(null),
    name: kValidationSchemas.name.allow(null),
    description: kValidationSchemas.description.allow(null),
    shouldRefresh: kAgentTokenValidationSchemas.shouldRefresh,
    refreshDuration: kAgentTokenValidationSchemas.refreshDuration,
    shouldEncode: Joi.boolean().default(false),
  })
  .required();
