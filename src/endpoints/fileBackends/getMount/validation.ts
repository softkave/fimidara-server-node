import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {GetFileBackendMountEndpointParams} from './types.js';

export const getFileBackendMountJoiSchema =
  startJoiObject<GetFileBackendMountEndpointParams>({
    ...endpointValidationSchemas.workspaceResourceParts,
    mountId: kValidationSchemas.resourceId.required(),
  }).required();
