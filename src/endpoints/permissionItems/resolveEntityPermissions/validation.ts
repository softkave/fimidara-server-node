import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import {kEndpointConstants} from '../../constants.js';
import workspaceValidationSchemas from '../../workspaces/validation.js';
import {permissionItemConstants} from '../constants.js';
import permissionItemValidationSchemas from '../validation.js';
import {
  ResolveEntityPermissionItemInput,
  ResolveEntityPermissionItemInputTarget,
  ResolveEntityPermissionsEndpointParams,
} from './types.js';

const target = Joi.object<ResolveEntityPermissionItemInputTarget>().keys({
  targetId: permissionItemValidationSchemas.targetParts.targetId,
  folderpath: permissionItemValidationSchemas.targetParts.folderpath,
  filepath: permissionItemValidationSchemas.targetParts.filepath,
  workspaceRootname: workspaceValidationSchemas.rootname,
});
const itemInput = Joi.object<ResolveEntityPermissionItemInput>().keys({
  entityId: permissionItemValidationSchemas.entityParts.entityId,
  target: Joi.alternatives()
    .try(target, Joi.array().items(target).max(kEndpointConstants.inputListMax))
    .required(),
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
