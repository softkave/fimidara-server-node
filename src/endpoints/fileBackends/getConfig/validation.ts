import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {GetFileBackendConfigEndpointParams} from './types.js';

export const getFileBackendConfigJoiSchema =
  startJoiObject<GetFileBackendConfigEndpointParams>({
    ...endpointValidationSchemas.workspaceResourceParts,
    configId: kValidationSchemas.resourceId.required(),
  }).required();
