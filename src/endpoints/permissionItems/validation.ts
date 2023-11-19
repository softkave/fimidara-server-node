import Joi = require('joi');
import {getWorkspaceResourceTypeList} from '../../definitions/system';
import {validationSchemas} from '../../utils/validationUtils';
import {endpointConstants} from '../constants';
import fileValidationSchemas from '../files/validation';
import folderValidationSchemas from '../folders/validation';
import workspaceValidationSchemas from '../workspaces/validation';
import {permissionItemConstants} from './constants';
import {PermissionItemInput, PermissionItemInputTarget} from './types';

const targetId = validationSchemas.resourceId;
const targetType = Joi.string().valid(...getWorkspaceResourceTypeList());
const entityId = validationSchemas.resourceId;

// TODO: review max items
const targetParts = {
  targetId: Joi.alternatives().try(
    targetId,
    Joi.array().items(targetId).max(endpointConstants.inputListMax)
  ),
  targetType: Joi.alternatives().try(
    targetType,
    Joi.array().items(targetType).max(endpointConstants.inputListMax)
  ),
  folderpath: Joi.alternatives().try(
    folderValidationSchemas.folderpath,
    Joi.array()
      .items(folderValidationSchemas.folderpath)
      .max(endpointConstants.inputListMax)
  ),
  filepath: Joi.alternatives().try(
    fileValidationSchemas.fileMatcherParts.filepath,
    Joi.array()
      .items(fileValidationSchemas.fileMatcherParts.filepath)
      .max(endpointConstants.inputListMax)
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
  Joi.array().items(target).max(endpointConstants.inputListMax)
);
const entityParts = {
  entityId: Joi.alternatives().try(
    entityId,
    Joi.array().items(entityId).max(endpointConstants.inputListMax)
  ),
};
const itemInput = Joi.object<PermissionItemInput>().keys({
  target: targetOrList.required(),
  action: validationSchemas.crudActionOrList.required(),
  access: Joi.boolean().required(),
  entityId: entityParts.entityId,
});
const itemInputList = Joi.array()
  .items(itemInput)
  .max(permissionItemConstants.maxPermissionItemsPerRequest);
const itemIds = Joi.array()
  .items(validationSchemas.resourceId.required())
  .max(permissionItemConstants.maxPermissionItemsPerRequest)
  .unique();
const publicAccessOp = Joi.object().keys({
  action: validationSchemas.crudAction.required(),
  resourceType: validationSchemas.resourceType.required(),
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
