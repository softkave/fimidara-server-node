import * as Joi from 'joi';
import {IPermissionGroupInput} from '../../definitions/permissionGroups';
import {validationSchemas} from '../../utilities/validationUtils';
import {permissionGroupConstants} from './constants';

const assignedPermissionGroup = Joi.object().keys({
  permissionGroupId: validationSchemas.nanoid.required(),
  order: Joi.number(),
});

const assignedPermissionGroupsList = Joi.array()
  .items(assignedPermissionGroup)
  .unique(
    (a: IPermissionGroupInput, b: IPermissionGroupInput) =>
      a.permissionGroupId === b.permissionGroupId
  )
  .max(permissionGroupConstants.maxAssignedPermissionGroups);

const permissionGroupsValidationSchemas = {
  assignedPermissionGroup,
  assignedPermissionGroupsList,
};

export default permissionGroupsValidationSchemas;
