import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import {DeleteFileBackendConfigEndpointParams} from './types';

export const deleteFileBackendConfigJoiSchema =
  Joi.object<DeleteFileBackendConfigEndpointParams>()
    .keys({
      ...endpointValidationSchemas.workspaceResourceParts,
      configId: validationSchemas.resourceId.required(),
    })
    .required();
