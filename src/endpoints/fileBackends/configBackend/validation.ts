import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import {ConfigFileBackendEndpointParams} from './types';

export const configFileBackendJoiSchema = Joi.object<ConfigFileBackendEndpointParams>()
  .keys({
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    token: Joi.object<ConfigFileBackendEndpointParams['token']>()
      .keys({
        expires: validationSchemas.time.allow(null),
        providedResourceId: validationSchemas.providedResourceId.allow(null),
        name: validationSchemas.name.allow(null),
        description: validationSchemas.description.allow(null),
      })
      .required(),
  })
  .required();
