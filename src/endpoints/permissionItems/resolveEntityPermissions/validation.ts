import * as Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils';
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
  folderpath: permissionItemValidationSchemas.targetParts.folderpath,
  filepath: permissionItemValidationSchemas.targetParts.filepath,
  workspaceRootname: workspaceValidationSchemas.rootname,
});
const itemInput = Joi.object<ResolveEntityPermissionItemInput>().keys({
  entityId: permissionItemValidationSchemas.entityParts.entityId,
  target: Joi.alternatives()
    .try(target, Joi.array().items(target).max(endpointConstants.inputListMax))
    .required(),
  action: kValidationSchemas.crudActionOrList.required(),
});
const itemInputList = Joi.array()
  .items(itemInput)
  .max(permissionItemConstants.maxPermissionItemsPerRequest);

export const resolveEntityPermissionsJoiSchema =
  Joi.object<ResolveEntityPermissionsEndpointParams>()
    .keys({
      workspaceId: kValidationSchemas.resourceId,
      items: itemInputList.required(),
    })
    .required();
