import Joi = require('joi');
import {PermissionItemAppliesTo} from '../../definitions/permissionItem';
import {getWorkspaceResourceTypeList} from '../../definitions/system';
import {validationSchemas} from '../../utils/validationUtils';
import fileValidationSchemas from '../files/validation';
import folderValidationSchemas from '../folders/validation';
import workspaceValidationSchemas from '../workspaces/validation';
import {permissionItemConstants} from './constants';
import {
  IPermissionItemInput,
  IPermissionItemInputEntity,
  IPermissionItemInputTarget,
} from './types';

const targetId = validationSchemas.resourceId;
const targetType = Joi.string().valid(...getWorkspaceResourceTypeList());
const entityId = validationSchemas.resourceId;
const appliesTo = Joi.string().valid(
  PermissionItemAppliesTo.Self,
  PermissionItemAppliesTo.SelfAndChildrenOfType,
  PermissionItemAppliesTo.ChildrenOfType
);

// TODO: review max items
const targetParts = {
  targetId: Joi.alternatives().try(targetId, Joi.array().items(targetId).max(100)),
  targetType: Joi.alternatives().try(targetType, Joi.array().items(targetType).max(100)),
  folderpath: Joi.alternatives().try(
    folderValidationSchemas.folderpath,
    Joi.array().items(folderValidationSchemas.folderpath).max(100)
  ),
  filepath: Joi.alternatives().try(
    fileValidationSchemas.fileMatcherParts.filepath,
    Joi.array().items(fileValidationSchemas.fileMatcherParts.filepath).max(100)
  ),
  workspaceRootname: workspaceValidationSchemas.rootname,
};
const target = Joi.object<IPermissionItemInputTarget>().keys({
  targetId: targetParts.targetId.required(),
  targetType: targetParts.targetType,
  folderpath: targetParts.folderpath,
  filepath: targetParts.filepath,
  workspaceRootname: workspaceValidationSchemas.rootname,
});
const entity = Joi.object<IPermissionItemInputEntity>().keys({
  entityId: Joi.alternatives().try(entityId, Joi.array().items(entityId).max(100)),
});
const itemInput = Joi.object<IPermissionItemInput>().keys({
  entity,
  target: target.required(),
  action: validationSchemas.crudAction.required(),
  grantAccess: Joi.boolean().required(),
  appliesTo: appliesTo.required(),
});
const itemInputList = Joi.array()
  .items(itemInput)
  .max(permissionItemConstants.maxPermissionItemsSavedPerRequest);
const itemIds = Joi.array()
  .items(validationSchemas.resourceId.required())
  .max(permissionItemConstants.maxPermissionItemsSavedPerRequest)
  .unique();
const publicAccessOp = Joi.object().keys({
  action: validationSchemas.crudAction.required(),
  resourceType: validationSchemas.resourceType.required(),
});
const publicAccessOpList = Joi.array()
  .items(publicAccessOp)
  .max(permissionItemConstants.maxPermissionItemsSavedPerRequest);

const permissionItemValidationSchemas = {
  appliesTo,
  entity,
  target,
  itemIds,
  itemInput,
  itemInputList,
  publicAccessOp,
  publicAccessOpList,
  targetParts,
};

export default permissionItemValidationSchemas;
