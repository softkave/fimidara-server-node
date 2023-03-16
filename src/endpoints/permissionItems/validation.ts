import Joi = require('joi');
import {validationSchemas} from '../../utils/validationUtils';
import {INewPermissionItemInput} from './addItems/types';
import {permissionItemConstants} from './constants';

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
const itemInputByEntity = Joi.object<INewPermissionItemInput>().keys({
  ...targetParts,
  action: validationSchemas.crudAction.required(),
  grantAccess: Joi.boolean().required(),
});
const itemInput = Joi.object<INewPermissionItemInput>().keys({
  ...targetParts,
  action: validationSchemas.crudAction.required(),
  grantAccess: Joi.boolean().required(),
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
  publicAccessOp,
  publicAccessOpList,
};

export default permissionItemValidationSchemas;
