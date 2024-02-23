import * as Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils';
import {kEndpointConstants} from '../../constants';
import workspaceValidationSchemas from '../../workspaces/validation';
import {permissionItemConstants} from '../constants';
import permissionItemValidationSchemas from '../validation';
import {
  DeletePermissionItemInput,
  DeletePermissionItemInputTarget,
  DeletePermissionItemsEndpointParams,
} from './types';

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
