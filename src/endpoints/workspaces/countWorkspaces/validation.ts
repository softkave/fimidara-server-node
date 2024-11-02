import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {CountWorkspacesEndpointParams} from './types.js';

export const countWorkspacesJoiSchema =
  startJoiObject<CountWorkspacesEndpointParams>({
    workspaceId: kValidationSchemas.resourceId,
  }).required();
