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
  isForPermissionOwnerOnly: Joi.boolean().allow(null),
});

const itemInputByEntityList = Joi.array()
  .items(itemInputByEntity)
  .max(permissionItemConstants.maxPermissionItemsSavedPerRequest);

const itemInputByResource = Joi.object().keys({
  permissionEntityId: validationSchemas.nanoid.required(),
  permissionEntityType: validationSchemas.resourceType.required(),
  action: validationSchemas.crudAction.required(),
  isExclusion: Joi.boolean().allow(null),
  isForPermissionOwnerOnly: Joi.boolean().allow(null),
  permissionOwnerId: validationSchemas.nanoid.required(),
  permissionOwnerType: validationSchemas.resourceType.required(),
  isWildcardResourceType: Joi.bool(),
});

const itemInputByResourceList = Joi.array()
  .items(itemInputByResource)
  .max(permissionItemConstants.maxPermissionItemsSavedPerRequest);

const itemIds = Joi.array()
  .items(validationSchemas.nanoid.required())
  .max(permissionItemConstants.maxPermissionItemsSavedPerRequest)
  .unique();

const permissionItemValidationSchemas = {
  itemInputByEntity,
  itemInputByEntityList,
  itemIds,
  itemInputByResource,
  itemInputByResourceList,
};

export default permissionItemValidationSchemas;
