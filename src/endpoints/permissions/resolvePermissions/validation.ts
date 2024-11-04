import Joi from 'joi';
import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import workspaceValidationSchemas from '../../workspaces/validation.js';
import {permissionItemConstants} from '../constants.js';
import {permissionItemValidationSchemas} from '../validation.js';
import {
  ResolvePermissionItemInput,
  ResolvePermissionsEndpointParams,
} from './types.js';

const itemInput = startJoiObject<ResolvePermissionItemInput>({
  entityId: permissionItemValidationSchemas.entityParts.entityId,
  targetId: permissionItemValidationSchemas.targetParts.targetId,
  folderpath: permissionItemValidationSchemas.targetParts.folderpath,
  filepath: permissionItemValidationSchemas.targetParts.filepath,
  workspaceRootname: workspaceValidationSchemas.rootname,
  action: kValidationSchemas.crudActionOrList.required(),
});
const itemInputList = Joi.array()
  .items(itemInput)
  .max(permissionItemConstants.maxPermissionItemsPerRequest);

export const resolvePermissionsJoiSchema =
  startJoiObject<ResolvePermissionsEndpointParams>({
    workspaceId: kValidationSchemas.resourceId,
    items: itemInputList.required(),
  }).required();
