import Joi = require('joi');
import {validationSchemas} from '../../utilities/validationUtils';
import {permissionItemConstants} from './constants';

const itemInputByEntity = Joi.object().keys({
  permissionOwnerId: validationSchemas.nanoid.required(),
  permissionOwnerType: validationSchemas.resourceType.required(),
  itemResourceId: validationSchemas.nanoid.allow(null),
  itemResourceType: validationSchemas.resourceType.required(),
  action: validationSchemas.crudAction.required(),
  isExclusion: Joi.boolean().allow(null),
  isForPermissionOwner: Joi.boolean().allow(null),
  isForPermissionOwnerChildren: Joi.boolean().allow(null),
});

const itemInput = Joi.object().keys({
  permissionOwnerId: validationSchemas.nanoid.required(),
  permissionOwnerType: validationSchemas.resourceType.required(),
  itemResourceId: validationSchemas.nanoid.allow(null),
  itemResourceType: validationSchemas.resourceType.required(),
  action: validationSchemas.crudAction.required(),
  isExclusion: Joi.boolean().allow(null),
  isForPermissionOwner: Joi.boolean().allow(null),
  isForPermissionOwnerChildren: Joi.boolean().allow(null),
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
