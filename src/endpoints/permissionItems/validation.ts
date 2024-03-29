import Joi = require('joi');
import {getWorkspaceResourceTypeList} from '../../definitions/system';
import {kValidationSchemas} from '../../utils/validationUtils';
import {kEndpointConstants} from '../constants';
import fileValidationSchemas from '../files/validation';
import folderValidationSchemas from '../folders/validation';
import workspaceValidationSchemas from '../workspaces/validation';
import {permissionItemConstants} from './constants';
import {PermissionItemInput, PermissionItemInputTarget} from './types';

const targetId = kValidationSchemas.resourceId;
const targetType = Joi.string().valid(...getWorkspaceResourceTypeList());
const entityId = kValidationSchemas.resourceId;

// TODO: review max items
const targetParts = {
  targetId: Joi.alternatives().try(
    targetId,
    Joi.array().items(targetId).max(kEndpointConstants.inputListMax)
  ),
  targetType: Joi.alternatives().try(
    targetType,
    Joi.array().items(targetType).max(kEndpointConstants.inputListMax)
  ),
  folderpath: Joi.alternatives().try(
    folderValidationSchemas.folderpath,
    Joi.array()
      .items(folderValidationSchemas.folderpath)
      .max(kEndpointConstants.inputListMax)
  ),
  filepath: Joi.alternatives().try(
    fileValidationSchemas.fileMatcherParts.filepath,
    Joi.array()
      .items(fileValidationSchemas.fileMatcherParts.filepath)
      .max(kEndpointConstants.inputListMax)
  ),
  workspaceRootname: workspaceValidationSchemas.rootname,
};
const target = Joi.object<PermissionItemInputTarget>().keys({
  targetId: targetParts.targetId,
  folderpath: targetParts.folderpath,
  filepath: targetParts.filepath,
  workspaceRootname: workspaceValidationSchemas.rootname,
});
const targetOrList = Joi.alternatives().try(
  target,
  Joi.array().items(target).max(kEndpointConstants.inputListMax)
);
const entityParts = {
  entityId: Joi.alternatives().try(
    entityId,
    Joi.array().items(entityId).max(kEndpointConstants.inputListMax)
  ),
};
const itemInput = Joi.object<PermissionItemInput>().keys({
  target: targetOrList.required(),
  action: kValidationSchemas.crudActionOrList.required(),
  access: Joi.boolean().required(),
  entityId: entityParts.entityId,
});
const itemInputList = Joi.array()
  .items(itemInput)
  .max(permissionItemConstants.maxPermissionItemsPerRequest);
const itemIds = Joi.array()
  .items(kValidationSchemas.resourceId.required())
  .max(permissionItemConstants.maxPermissionItemsPerRequest)
  .unique();
const publicAccessOp = Joi.object().keys({
  action: kValidationSchemas.crudAction.required(),
  resourceType: kValidationSchemas.resourceType.required(),
});
const publicAccessOpList = Joi.array()
  .items(publicAccessOp)
  .max(permissionItemConstants.maxPermissionItemsPerRequest);

const permissionItemValidationSchemas = {
  target,
  itemIds,
  itemInput,
  itemInputList,
  publicAccessOp,
  publicAccessOpList,
  targetParts,
  entityParts,
};

export default permissionItemValidationSchemas;
