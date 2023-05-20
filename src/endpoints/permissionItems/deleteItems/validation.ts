import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import {endpointConstants} from '../../constants';
import workspaceValidationSchemas from '../../workspaces/validation';
import {permissionItemConstants} from '../constants';
import permissionItemValidationSchemas from '../validation';
import {
  DeletePermissionItemInput,
  DeletePermissionItemInputTarget,
  DeletePermissionItemsEndpointParams,
} from './types';

const target = Joi.object<DeletePermissionItemInputTarget>().keys({
  targetId: permissionItemValidationSchemas.targetParts.targetId,
  targetType: permissionItemValidationSchemas.targetParts.targetType,
  folderpath: permissionItemValidationSchemas.targetParts.folderpath,
  filepath: permissionItemValidationSchemas.targetParts.filepath,
  workspaceRootname: workspaceValidationSchemas.rootname,
});

const itemInput = Joi.object<DeletePermissionItemInput>().keys({
  entity: permissionItemValidationSchemas.entity,
  target: Joi.alternatives().try(
    target,
    Joi.array().items(target).max(endpointConstants.inputListMax)
  ),
  action: validationSchemas.crudActionOrList,
  grantAccess: Joi.alternatives().try(Joi.boolean(), Joi.array().items(Joi.boolean()).max(2)),
  appliesTo: permissionItemValidationSchemas.appliesToOrList,
});

export const deletePermissionItemsJoiSchema = Joi.object<DeletePermissionItemsEndpointParams>()
  .keys({
    workspaceId: validationSchemas.resourceId,
    entity: permissionItemValidationSchemas.entity,
    items: Joi.array()
      .items(itemInput)
      .max(permissionItemConstants.maxPermissionItemsPerRequest)
      .required(),
  })
  .required();
