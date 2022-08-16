import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import permissionGroupsValidationSchemas from '../../permissionGroups/validation';

export const updateRequestInputJoiSchema = Joi.object().keys({
  message: validationSchemas.description.allow(null),
  expires: validationSchemas.time.allow(null),
  permissionGroupsOnAccept:
    permissionGroupsValidationSchemas.assignedPermissionGroupsList.allow(null),
});

export const updateRequestJoiSchema = Joi.object()
  .keys({
    requestId: validationSchemas.resourceId.required(),
    request: updateRequestInputJoiSchema.required(),
  })
  .required();
