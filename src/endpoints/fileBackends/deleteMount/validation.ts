import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {DeleteFileBackendMountEndpointParams} from './types.js';

export const deleteFileBackendMountJoiSchema =
  Joi.object<DeleteFileBackendMountEndpointParams>()
    .keys({
      ...endpointValidationSchemas.workspaceResourceParts,
      mountId: kValidationSchemas.resourceId.required(),
    })
    .required();
