import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {DeleteFileBackendConfigEndpointParams} from './types.js';

export const deleteFileBackendConfigJoiSchema =
  startJoiObject<DeleteFileBackendConfigEndpointParams>({
    ...endpointValidationSchemas.workspaceResourceParts,
    configId: kValidationSchemas.resourceId.required(),
  }).required();
