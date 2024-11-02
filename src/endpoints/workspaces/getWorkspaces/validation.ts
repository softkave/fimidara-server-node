import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {GetWorkspacesEndpointParams} from './types.js';

export const getWorkspacesJoiSchema =
  startJoiObject<GetWorkspacesEndpointParams>({
    ...endpointValidationSchemas.paginationParts,
    workspaceId: kValidationSchemas.resourceId,
  }).required();
