import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {GetFileBackendMountEndpointParams} from './types.js';

export const getFileBackendMountJoiSchema =
  Joi.object<GetFileBackendMountEndpointParams>()
    .keys({
      ...endpointValidationSchemas.workspaceResourceParts,
      mountId: kValidationSchemas.resourceId.required(),
    })
    .required();
