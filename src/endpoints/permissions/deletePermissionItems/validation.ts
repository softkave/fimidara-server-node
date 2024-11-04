import Joi from 'joi';
import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import workspaceValidationSchemas from '../../workspaces/validation.js';
import {permissionItemConstants} from '../constants.js';
import {permissionItemValidationSchemas} from '../validation.js';
import {
  DeletePermissionItemInput,
  DeletePermissionItemsEndpointParams,
} from './types.js';

const itemInput = startJoiObject<DeletePermissionItemInput>({
  entityId: permissionItemValidationSchemas.entityParts.entityId,
  targetId: permissionItemValidationSchemas.targetParts.targetId,
  folderpath: permissionItemValidationSchemas.targetParts.folderpath,
  filepath: permissionItemValidationSchemas.targetParts.filepath,
  workspaceRootname: workspaceValidationSchemas.rootname,
  action: kValidationSchemas.crudActionOrList,
  access: Joi.boolean(),
});

export const deletePermissionItemsJoiSchema =
  startJoiObject<DeletePermissionItemsEndpointParams>({
    workspaceId: kValidationSchemas.resourceId,
    items: Joi.array()
      .items(itemInput)
      .max(permissionItemConstants.maxPermissionItemsPerRequest)
      .required(),
  }).required();
