import * as Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import {GetFileBackendConfigEndpointParams} from './types';

export const getFileBackendConfigJoiSchema =
  Joi.object<GetFileBackendConfigEndpointParams>()
    .keys({
      ...endpointValidationSchemas.workspaceResourceParts,
      configId: kValidationSchemas.resourceId.required(),
    })
    .required();
