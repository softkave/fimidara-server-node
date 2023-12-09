import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import {DeleteFileBackendMountEndpointParams} from './types';

export const deleteFileBackendMountJoiSchema =
  Joi.object<DeleteFileBackendMountEndpointParams>()
    .keys({
      ...endpointValidationSchemas.workspaceResourceParts,
      mountId: validationSchemas.resourceId.required(),
    })
    .required();
