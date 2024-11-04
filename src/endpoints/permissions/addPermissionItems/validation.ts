import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {permissionItemValidationSchemas} from '../validation.js';
import {AddPermissionItemsEndpointParams} from './types.js';

export const addPermissionItemsJoiSchema =
  startJoiObject<AddPermissionItemsEndpointParams>({
    workspaceId: kValidationSchemas.resourceId,
    items: permissionItemValidationSchemas.itemInputList.required(),
  }).required();
