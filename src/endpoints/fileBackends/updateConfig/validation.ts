import * as Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import fileBackendValidationSchemas from '../validation';
import {UpdateFileBackendConfigEndpointParams} from './types';

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
