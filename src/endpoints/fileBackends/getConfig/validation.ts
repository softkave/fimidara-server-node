import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {GetFileBackendConfigEndpointParams} from './types.js';

export const getFileBackendConfigJoiSchema =
  Joi.object<GetFileBackendConfigEndpointParams>()
    .keys({
      ...endpointValidationSchemas.workspaceResourceParts,
      configId: kValidationSchemas.resourceId.required(),
    })
    .required();
