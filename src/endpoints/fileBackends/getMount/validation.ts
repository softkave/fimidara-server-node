import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import {GetFileBackendMountEndpointParams} from './types';

export const getFileBackendMountJoiSchema =
  Joi.object<GetFileBackendMountEndpointParams>()
    .keys({
      ...endpointValidationSchemas.workspaceResourceParts,
      mountId: validationSchemas.resourceId.required(),
    })
    .required();
