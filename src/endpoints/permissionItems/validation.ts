import Joi from 'joi';
import {getWorkspaceResourceTypeList} from '../../definitions/system.js';
import {kValidationSchemas} from '../../utils/validationUtils.js';
import {kEndpointConstants} from '../constants.js';
import fileValidationSchemas from '../files/validation.js';
import folderValidationSchemas from '../folders/validation.js';
import workspaceValidationSchemas from '../workspaces/validation.js';
import {permissionItemConstants} from './constants.js';
import {PermissionItemInput} from './types.js';

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

const entityParts = {
  entityId: Joi.alternatives().try(
    entityId,
    Joi.array().items(entityId).unique().max(kEndpointConstants.inputListMax)
  ),
};
const itemInput = Joi.object<PermissionItemInput>().keys({
  targetId: targetParts.targetId,
  folderpath: targetParts.folderpath,
  filepath: targetParts.filepath,
  workspaceRootname: workspaceValidationSchemas.rootname,
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
  itemIds,
  itemInput,
  itemInputList,
  publicAccessOp,
  publicAccessOpList,
  targetParts,
  entityParts,
};

export default permissionItemValidationSchemas;
