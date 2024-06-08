import Joi from 'joi';
import {AssignPermissionGroupInput} from '../../definitions/permissionGroups.js';
import {kValidationSchemas} from '../../utils/validationUtils.js';
import {permissionGroupConstants} from './constants.js';

const assignedPermissionGroup = Joi.object().keys({
  permissionGroupId: kValidationSchemas.resourceId.required(),
  order: Joi.number(),
});

const assignedPermissionGroupsList = Joi.array()
  .items(assignedPermissionGroup)
  .unique(
    (a: AssignPermissionGroupInput, b: AssignPermissionGroupInput) =>
      a.permissionGroupId === b.permissionGroupId
  )
  .max(permissionGroupConstants.maxAssignedPermissionGroups);

const permissionGroupsValidationSchemas = {
  assignedPermissionGroup,
  assignedPermissionGroupsList,
};

export default permissionGroupsValidationSchemas;
