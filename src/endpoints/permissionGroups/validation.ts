import * as Joi from 'joi';
import {IAssignPermissionGroupInput} from '../../definitions/permissionGroups';
import {validationSchemas} from '../../utils/validationUtils';
import {permissionGroupConstants} from './constants';

const assignedPermissionGroup = Joi.object().keys({
  permissionGroupId: validationSchemas.resourceId.required(),
  order: Joi.number(),
});

const assignedPermissionGroupsList = Joi.array()
  .items(assignedPermissionGroup)
  .unique(
    (a: IAssignPermissionGroupInput, b: IAssignPermissionGroupInput) => a.permissionGroupId === b.permissionGroupId
  )
  .max(permissionGroupConstants.maxAssignedPermissionGroups);

const permissionGroupsValidationSchemas = {
  assignedPermissionGroup,
  assignedPermissionGroupsList,
};

export default permissionGroupsValidationSchemas;
