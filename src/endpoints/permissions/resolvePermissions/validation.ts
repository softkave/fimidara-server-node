import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import workspaceValidationSchemas from '../../workspaces/validation.js';
import {permissionItemConstants} from '../constants.js';
import permissionItemValidationSchemas from '../validation.js';
import {
  ResolvePermissionItemInput,
  ResolvePermissionsEndpointParams,
} from './types.js';

const itemInput = Joi.object<ResolvePermissionItemInput>().keys({
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
  Joi.object<ResolvePermissionsEndpointParams>()
    .keys({
      workspaceId: kValidationSchemas.resourceId,
      items: itemInputList.required(),
    })
    .required();
