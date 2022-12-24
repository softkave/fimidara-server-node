import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import permissionGroupsValidationSchemas from '../../permissionGroups/validation';
import userValidationSchemas from '../../user/validation';

export const requestJoiSchema = Joi.object().keys({
  recipientEmail: userValidationSchemas.email.required(),
  message: validationSchemas.description.allow(null),
  expires: validationSchemas.time.allow(null),
  permissionGroupsOnAccept: permissionGroupsValidationSchemas.assignedPermissionGroupsList.allow(null),
});

export const sendCollaborationRequestJoiSchema = Joi.object()
  .keys({
    workspaceId: validationSchemas.resourceId,
    request: requestJoiSchema.required(),
  })
  .required();
