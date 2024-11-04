import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import fileBackendValidationSchemas from '../validation.js';
import {AddFileBackendConfigEndpointParams} from './types.js';

export const addConfigJoiSchema =
  startJoiObject<AddFileBackendConfigEndpointParams>({
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    backend: fileBackendValidationSchemas.nonFimidaraBackend.required(),
    credentials: fileBackendValidationSchemas.credentials.required(),
    name: kValidationSchemas.name.required(),
    description: kValidationSchemas.description.allow(null),
  }).required();
