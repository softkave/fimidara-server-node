import * as Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import {AddAgentTokenEndpointParams} from './types';

export const addAgentTokenJoiSchema = Joi.object<AddAgentTokenEndpointParams>()
  .keys({
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    token: Joi.object<AddAgentTokenEndpointParams['token']>()
      .keys({
        expires: kValidationSchemas.time.allow(null),
        providedResourceId: kValidationSchemas.providedResourceId.allow(null),
        name: kValidationSchemas.name.allow(null),
        description: kValidationSchemas.description.allow(null),
      })
      .required(),
  })
  .required();
