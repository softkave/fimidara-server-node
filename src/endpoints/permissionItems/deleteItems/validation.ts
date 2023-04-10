import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import workspaceValidationSchemas from '../../workspaces/validation';
import {permissionItemConstants} from '../constants';
import {IPermissionItemInputTarget} from '../types';
import permissionItemValidationSchemas from '../validation';
import {DeletePermissionItemInput, IDeletePermissionItemsEndpointParams} from './types';

const itemInput = Joi.object<DeletePermissionItemInput>().keys({
  entity: permissionItemValidationSchemas.entity,
  target: Joi.object<Partial<IPermissionItemInputTarget>>().keys({
    targetId: permissionItemValidationSchemas.targetParts.targetId,
    targetType: permissionItemValidationSchemas.targetParts.targetType,
    folderpath: permissionItemValidationSchemas.targetParts.folderpath,
    filepath: permissionItemValidationSchemas.targetParts.filepath,
    workspaceRootname: workspaceValidationSchemas.rootname,
  }),
  action: validationSchemas.crudAction,
  grantAccess: Joi.boolean(),
  appliesTo: permissionItemValidationSchemas.appliesTo,
});

export const deletePermissionItemsJoiSchema = Joi.object<IDeletePermissionItemsEndpointParams>()
  .keys({
    workspaceId: validationSchemas.resourceId,
    entity: permissionItemValidationSchemas.entity,
    items: Joi.array()
      .items(itemInput)
      .max(permissionItemConstants.maxPermissionItemsSavedPerRequest)
      .required(),
  })
  .required();
