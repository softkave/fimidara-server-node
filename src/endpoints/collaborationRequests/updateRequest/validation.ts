import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import permissionGroupsValidationSchemas from '../../permissionGroups/validation';

export const updateCollaborationRequestInputJoiSchema = Joi.object().keys({
  message: validationSchemas.description.allow(null),
  expires: validationSchemas.time.allow(null),
  permissionGroupsOnAccept: permissionGroupsValidationSchemas.assignedPermissionGroupsList.allow(null),
});

export const updateCollaborationRequestJoiSchema = Joi.object()
  .keys({
    requestId: validationSchemas.resourceId.required(),
    request: updateCollaborationRequestInputJoiSchema.required(),
  })
  .required();
