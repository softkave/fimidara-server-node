import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import permissionGroupsValidationSchemas from '../../permissionGroups/validation';

export const updateCollaboratorPermissionGroupsJoiSchema = Joi.object()
  .keys({
    workspaceId: validationSchemas.resourceId,
    collaboratorId: validationSchemas.resourceId.required(),
    permissionGroups:
      permissionGroupsValidationSchemas.assignedPermissionGroupsList.required(),
  })
  .required();
