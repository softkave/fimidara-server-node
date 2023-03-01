import Joi = require('joi');
import {PermissionItemAppliesTo} from '../../definitions/permissionItem';
import {validationSchemas} from '../../utils/validationUtils';
import {INewPermissionItemInput} from './addItems/types';
import {permissionItemConstants} from './constants';
import {INewPermissionItemInputByEntity} from './replaceItemsByEntity/types';

const appliesTo = Joi.string()
  .valid(...Object.values(PermissionItemAppliesTo))
  .default(PermissionItemAppliesTo.ContainerAndChildren);
const targetParts = {
  targetId: validationSchemas.resourceId.allow(null).when('targetType', {
    is: Joi.any().valid(null, undefined),
    then: validationSchemas.resourceType.required(),
  }),
  targetType: validationSchemas.resourceType.allow(null).when('targetId', {
    is: Joi.any().valid(null, undefined),
    then: validationSchemas.resourceType.required(),
  }),
};
const itemInputByEntity = Joi.object<INewPermissionItemInputByEntity>().keys({
  ...targetParts,
  appliesTo,
  containerId: validationSchemas.resourceId.required(),
  action: validationSchemas.crudAction.required(),
  grantAccess: Joi.boolean().required(),
});
const itemInput = Joi.object<INewPermissionItemInput>().keys({
  ...targetParts,
  appliesTo,
  containerId: validationSchemas.resourceId.required(),
  action: validationSchemas.crudAction.required(),
  grantAccess: Joi.boolean().required(),
  entityId: validationSchemas.resourceId.required(),
});
const itemInputByEntityList = Joi.array()
  .items(itemInputByEntity)
  .max(permissionItemConstants.maxPermissionItemsSavedPerRequest);
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
  appliesTo: appliesTo.required(),
});
const publicAccessOpList = Joi.array()
  .items(publicAccessOp)
  .max(permissionItemConstants.maxPermissionItemsSavedPerRequest);

const permissionItemValidationSchemas = {
  itemInputByEntity,
  itemInputByEntityList,
  itemIds,
  itemInput,
  itemInputList,
  appliesTo,
  publicAccessOp,
  publicAccessOpList,
};

export default permissionItemValidationSchemas;
