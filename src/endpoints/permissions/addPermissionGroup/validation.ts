import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {AddPermissionGroupEndpointParams} from './types.js';

export const addPermissionGroupJoiSchema =
  startJoiObject<AddPermissionGroupEndpointParams>({
    workspaceId: kValidationSchemas.resourceId,
    name: kValidationSchemas.name.required(),
    description: kValidationSchemas.description.allow(null),
  }).required();
