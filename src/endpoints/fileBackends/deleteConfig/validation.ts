import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {DeleteFileBackendConfigEndpointParams} from './types.js';

export const deleteFileBackendConfigJoiSchema =
  Joi.object<DeleteFileBackendConfigEndpointParams>()
    .keys({
      ...endpointValidationSchemas.workspaceResourceParts,
      configId: kValidationSchemas.resourceId.required(),
    })
    .required();
