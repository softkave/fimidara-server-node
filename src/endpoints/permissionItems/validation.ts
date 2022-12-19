import Joi = require('joi');
import {PermissionItemAppliesTo} from '../../definitions/permissionItem';
import {validationSchemas} from '../../utils/validationUtils';
import {permissionItemConstants} from './constants';

const appliesTo = Joi.string()
  .valid(...Object.values(PermissionItemAppliesTo))
  .default(PermissionItemAppliesTo.OwnerAndChildren);

const itemInputByEntity = Joi.object().keys({
  appliesTo,
  permissionOwnerId: validationSchemas.resourceId.required(),
  permissionOwnerType: validationSchemas.resourceType.required(),
  itemResourceId: validationSchemas.resourceId.allow(null),
  itemResourceType: validationSchemas.resourceType.required(),
  action: validationSchemas.crudAction.required(),
  grantAccess: Joi.boolean().required(),
});

const itemInput = Joi.object().keys({
  appliesTo,
  permissionOwnerId: validationSchemas.resourceId.required(),
  permissionOwnerType: validationSchemas.resourceType.required(),
  itemResourceId: validationSchemas.resourceId.allow(null),
  itemResourceType: validationSchemas.resourceType.required(),
  action: validationSchemas.crudAction.required(),
  grantAccess: Joi.boolean().required(),
  permissionEntityId: validationSchemas.resourceId.required(),
  permissionEntityType: validationSchemas.resourceType.required(),
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
