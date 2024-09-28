import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import workspaceValidationSchemas from '../../workspaces/validation.js';
import {permissionItemConstants} from '../constants.js';
import permissionItemValidationSchemas from '../validation.js';
import {
  ResolveEntityPermissionItemInput,
  ResolveEntityPermissionsEndpointParams,
} from './types.js';

const itemInput = Joi.object<ResolveEntityPermissionItemInput>().keys({
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

export const resolveEntityPermissionsJoiSchema =
  Joi.object<ResolveEntityPermissionsEndpointParams>()
    .keys({
      workspaceId: kValidationSchemas.resourceId,
      items: itemInputList.required(),
    })
    .required();
