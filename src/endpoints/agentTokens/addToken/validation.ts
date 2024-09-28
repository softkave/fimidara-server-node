import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {AddAgentTokenEndpointParams} from './types.js';

export const addAgentTokenJoiSchema = Joi.object<AddAgentTokenEndpointParams>()
  .keys({
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    expires: kValidationSchemas.time.allow(null),
    providedResourceId: kValidationSchemas.providedResourceId.allow(null),
    name: kValidationSchemas.name.allow(null),
    description: kValidationSchemas.description.allow(null),
  })
  .required();
