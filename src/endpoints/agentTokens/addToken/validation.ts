import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import {AddAgentTokenEndpointParams} from './types';

export const addAgentTokenJoiSchema = Joi.object<AddAgentTokenEndpointParams>()
  .keys({
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    token: Joi.object<AddAgentTokenEndpointParams['token']>()
      .keys({
        expires: validationSchemas.time.allow(null),
        providedResourceId: validationSchemas.providedResourceId.allow(null),
        name: validationSchemas.name.allow(null),
        description: validationSchemas.description.allow(null),
      })
      .required(),
  })
  .required();
