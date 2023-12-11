import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import fileBackendValidationSchemas from '../validation';
import {AddFileBackendConfigEndpointParams} from './types';

export const addConfigJoiSchema = Joi.object<AddFileBackendConfigEndpointParams>()
  .keys({
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    config: Joi.object<AddFileBackendConfigEndpointParams['config']>()
      .keys({
        backend: fileBackendValidationSchemas.nonFimidaraBackend.required(),
        credentials: fileBackendValidationSchemas.credentials.required(),
        name: validationSchemas.name.required(),
        description: validationSchemas.description.allow(null),
      })
      .required(),
  })
  .required();
