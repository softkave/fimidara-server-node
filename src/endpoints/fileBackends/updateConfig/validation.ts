import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import fileBackendValidationSchemas from '../validation.js';
import {UpdateFileBackendConfigEndpointParams} from './types.js';

export const updateFileBackendConfigJoiSchema =
  startJoiObject<UpdateFileBackendConfigEndpointParams>({
    ...endpointValidationSchemas.workspaceResourceParts,
    configId: kValidationSchemas.resourceId.required(),
    config: startJoiObject<UpdateFileBackendConfigEndpointParams['config']>({
      credentials: fileBackendValidationSchemas.credentials,
      name: kValidationSchemas.name,
      description: kValidationSchemas.description.allow(null),
    }).required(),
  }).required();
