import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import {permissionItemConstants} from '../constants';
import permissionItemValidationSchemas from '../validation';
import {ResolveEntityPermissionItemInput, ResolveEntityPermissionsEndpointParams} from './types';

const itemInput = Joi.object<ResolveEntityPermissionItemInput>().keys({
  entity: permissionItemValidationSchemas.entity,
  target: permissionItemValidationSchemas.target.required(),
  action: validationSchemas.crudActionOrList.required(),
});
const itemInputList = Joi.array()
  .items(itemInput)
  .max(permissionItemConstants.maxPermissionItemsPerRequest);

export const resolveEntityPermissionsJoiSchema =
  Joi.object<ResolveEntityPermissionsEndpointParams>()
    .keys({
      workspaceId: validationSchemas.resourceId,
      entity: permissionItemValidationSchemas.entity,
      items: itemInputList.required(),
    })
    .required();
