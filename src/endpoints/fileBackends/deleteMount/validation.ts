import * as Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import {DeleteFileBackendMountEndpointParams} from './types';

export const deleteFileBackendMountJoiSchema =
  Joi.object<DeleteFileBackendMountEndpointParams>()
    .keys({
      ...endpointValidationSchemas.workspaceResourceParts,
      mountId: kValidationSchemas.resourceId.required(),
    })
    .required();
