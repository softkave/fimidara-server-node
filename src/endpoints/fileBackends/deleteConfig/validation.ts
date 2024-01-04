import * as Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import {DeleteFileBackendConfigEndpointParams} from './types';

export const deleteFileBackendConfigJoiSchema =
  Joi.object<DeleteFileBackendConfigEndpointParams>()
    .keys({
      ...endpointValidationSchemas.workspaceResourceParts,
      configId: kValidationSchemas.resourceId.required(),
    })
    .required();
