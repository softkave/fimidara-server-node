import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import permissionGroupsValidationSchemas from '../../permissionGroups/validation';

export const updateCollaboratorPermissionGroupsJoiSchema = Joi.object()
  .keys({
    workspaceId: validationSchemas.nanoid,
    collaboratorId: validationSchemas.nanoid.required(),
    permissionGroups:
      permissionGroupsValidationSchemas.assignedPermissionGroupsList.required(),
  })
  .required();
