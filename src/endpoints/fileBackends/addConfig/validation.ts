import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import fileBackendValidationSchemas from '../validation.js';
import {AddFileBackendConfigEndpointParams} from './types.js';

export const addConfigJoiSchema =
  Joi.object<AddFileBackendConfigEndpointParams>()
    .keys({
      ...endpointValidationSchemas.optionalWorkspaceIdParts,
      backend: fileBackendValidationSchemas.nonFimidaraBackend.required(),
      credentials: fileBackendValidationSchemas.credentials.required(),
      name: kValidationSchemas.name.required(),
      description: kValidationSchemas.description.allow(null),
    })
    .required();
