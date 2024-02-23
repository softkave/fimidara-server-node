import * as Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import {GetFileBackendMountEndpointParams} from './types';

export const getFileBackendMountJoiSchema =
  Joi.object<GetFileBackendMountEndpointParams>()
    .keys({
      ...endpointValidationSchemas.workspaceResourceParts,
      mountId: kValidationSchemas.resourceId.required(),
    })
    .required();
