import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import {permissionItemConstants} from '../constants';
import permissionItemValidationSchemas from '../validation';
import {DeletePermissionItemInput, IDeletePermissionItemsEndpointParams} from './types';

const itemInput = Joi.object<DeletePermissionItemInput>().keys({
  entity: permissionItemValidationSchemas.entity,
  container: permissionItemValidationSchemas.container,
  target: permissionItemValidationSchemas.target,
  action: validationSchemas.crudAction,
  grantAccess: Joi.boolean(),
});

export const deletePermissionItemsJoiSchema = Joi.object<IDeletePermissionItemsEndpointParams>()
  .keys({
    workspaceId: validationSchemas.resourceId,
    entity: permissionItemValidationSchemas.entity,
    container: permissionItemValidationSchemas.container,
    items: Joi.array()
      .items(itemInput)
      .max(permissionItemConstants.maxPermissionItemsSavedPerRequest)
      .required(),
  })
  .required();
