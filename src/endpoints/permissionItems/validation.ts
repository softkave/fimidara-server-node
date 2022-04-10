import Joi = require('joi');
import {PermissionItemAppliesTo} from '../../definitions/permissionItem';
import {validationSchemas} from '../../utilities/validationUtils';
import {permissionItemConstants} from './constants';

const appliesTo = Joi.string()
  .valid(...Object.values(PermissionItemAppliesTo))
  .default(PermissionItemAppliesTo.OwnerAndChildren);

const itemInputByEntity = Joi.object().keys({
  appliesTo,
  permissionOwnerId: validationSchemas.nanoid.required(),
  permissionOwnerType: validationSchemas.resourceType.required(),
  itemResourceId: validationSchemas.nanoid.allow(null),
  itemResourceType: validationSchemas.resourceType.required(),
  action: validationSchemas.crudAction.required(),
  grantAccess: Joi.boolean().required(),
});

const itemInput = Joi.object().keys({
  appliesTo,
  permissionOwnerId: validationSchemas.nanoid.required(),
  permissionOwnerType: validationSchemas.resourceType.required(),
  itemResourceId: validationSchemas.nanoid.allow(null),
  itemResourceType: validationSchemas.resourceType.required(),
  action: validationSchemas.crudAction.required(),
  grantAccess: Joi.boolean().required(),
  permissionEntityId: validationSchemas.nanoid.required(),
  permissionEntityType: validationSchemas.resourceType.required(),
});

const itemInputByEntityList = Joi.array()
  .items(itemInputByEntity)
  .max(permissionItemConstants.maxPermissionItemsSavedPerRequest);

const itemInputList = Joi.array()
  .items(itemInput)
  .max(permissionItemConstants.maxPermissionItemsSavedPerRequest);

const itemIds = Joi.array()
  .items(validationSchemas.nanoid.required())
  .max(permissionItemConstants.maxPermissionItemsSavedPerRequest)
  .unique();

const permissionItemValidationSchemas = {
  itemInputByEntity,
  itemInputByEntityList,
  itemIds,
  itemInput,
  itemInputList,
};

export default permissionItemValidationSchemas;
