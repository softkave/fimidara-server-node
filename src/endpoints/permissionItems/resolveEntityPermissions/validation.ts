import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import {endpointConstants} from '../../constants';
import workspaceValidationSchemas from '../../workspaces/validation';
import {permissionItemConstants} from '../constants';
import permissionItemValidationSchemas from '../validation';
import {
  ResolveEntityPermissionItemInput,
  ResolveEntityPermissionItemInputTarget,
  ResolveEntityPermissionsEndpointParams,
} from './types';

const target = Joi.object<ResolveEntityPermissionItemInputTarget>().keys({
  targetId: permissionItemValidationSchemas.targetParts.targetId,
  targetType: permissionItemValidationSchemas.targetParts.targetType,
  folderpath: permissionItemValidationSchemas.targetParts.folderpath,
  filepath: permissionItemValidationSchemas.targetParts.filepath,
  workspaceRootname: workspaceValidationSchemas.rootname,
});
const itemInput = Joi.object<ResolveEntityPermissionItemInput>().keys({
  entity: permissionItemValidationSchemas.entity,
  target: Joi.alternatives()
    .try(target, Joi.array().items(target).max(endpointConstants.inputListMax))
    .required(),
  action: validationSchemas.crudActionOrList.required(),
  containerAppliesTo: permissionItemValidationSchemas.appliesToOrList,
  targetAppliesTo: permissionItemValidationSchemas.appliesToOrList,
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
