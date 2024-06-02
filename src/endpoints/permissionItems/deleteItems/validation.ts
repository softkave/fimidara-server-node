import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import {kEndpointConstants} from '../../constants.js';
import workspaceValidationSchemas from '../../workspaces/validation.js';
import {permissionItemConstants} from '../constants.js';
import permissionItemValidationSchemas from '../validation.js';
import {
  DeletePermissionItemInput,
  DeletePermissionItemInputTarget,
  DeletePermissionItemsEndpointParams,
} from './types.js';

const target = Joi.object<DeletePermissionItemInputTarget>().keys({
  targetId: permissionItemValidationSchemas.targetParts.targetId,
  folderpath: permissionItemValidationSchemas.targetParts.folderpath,
  filepath: permissionItemValidationSchemas.targetParts.filepath,
  workspaceRootname: workspaceValidationSchemas.rootname,
});

const itemInput = Joi.object<DeletePermissionItemInput>().keys({
  entityId: permissionItemValidationSchemas.entityParts.entityId,
  target: Joi.alternatives().try(
    target,
    Joi.array().items(target).max(kEndpointConstants.inputListMax)
  ),
  action: kValidationSchemas.crudActionOrList,
  access: Joi.boolean(),
});

export const deletePermissionItemsJoiSchema =
  Joi.object<DeletePermissionItemsEndpointParams>()
    .keys({
      workspaceId: kValidationSchemas.resourceId,
      items: Joi.array()
        .items(itemInput)
        .max(permissionItemConstants.maxPermissionItemsPerRequest)
        .required(),
    })
    .required();
