import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import fileBackendValidationSchemas from '../validation';
import {UpdateFileBackendConfigEndpointParams} from './types';

export const updateFileBackendConfigJoiSchema =
  Joi.object<UpdateFileBackendConfigEndpointParams>()
    .keys({
      ...endpointValidationSchemas.workspaceResourceParts,
      configId: validationSchemas.resourceId.required(),
      config: Joi.object<UpdateFileBackendConfigEndpointParams['config']>()
        .keys({
          credentials: fileBackendValidationSchemas.credentials,
          name: validationSchemas.name,
          description: validationSchemas.description.allow(null),
        })
        .required(),
    })
    .required();
