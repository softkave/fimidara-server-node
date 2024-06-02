import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import fileBackendValidationSchemas from '../validation.js';
import {UpdateFileBackendConfigEndpointParams} from './types.js';

export const updateFileBackendConfigJoiSchema =
  Joi.object<UpdateFileBackendConfigEndpointParams>()
    .keys({
      ...endpointValidationSchemas.workspaceResourceParts,
      configId: kValidationSchemas.resourceId.required(),
      config: Joi.object<UpdateFileBackendConfigEndpointParams['config']>()
        .keys({
          credentials: fileBackendValidationSchemas.credentials,
          name: kValidationSchemas.name,
          description: kValidationSchemas.description.allow(null),
        })
        .required(),
    })
    .required();
