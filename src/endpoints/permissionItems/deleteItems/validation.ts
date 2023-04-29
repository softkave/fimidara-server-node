import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import workspaceValidationSchemas from '../../workspaces/validation';
import {permissionItemConstants} from '../constants';
import {PermissionItemInputTarget} from '../types';
import permissionItemValidationSchemas from '../validation';
import {DeletePermissionItemInput, DeletePermissionItemsEndpointParams} from './types';

const itemInput = Joi.object<DeletePermissionItemInput>().keys({
  entity: permissionItemValidationSchemas.entity,
  target: Joi.object<Partial<PermissionItemInputTarget>>().keys({
    targetId: permissionItemValidationSchemas.targetParts.targetId,
    targetType: permissionItemValidationSchemas.targetParts.targetType,
    folderpath: permissionItemValidationSchemas.targetParts.folderpath,
    filepath: permissionItemValidationSchemas.targetParts.filepath,
    workspaceRootname: workspaceValidationSchemas.rootname,
  }),
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
