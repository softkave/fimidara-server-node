import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {DeleteFileBackendMountEndpointParams} from './types.js';

export const deleteFileBackendMountJoiSchema =
  startJoiObject<DeleteFileBackendMountEndpointParams>({
    ...endpointValidationSchemas.workspaceResourceParts,
    mountId: kValidationSchemas.resourceId.required(),
  }).required();
