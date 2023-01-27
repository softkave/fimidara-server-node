import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import permissionGroupsValidationSchemas from '../../permissionGroups/validation';
import tagsValidationSchemas from '../../tags/validation';

export const newClientAssignedTokenJoiSchema = Joi.object().keys({
  expires: validationSchemas.time.allow(null),
  providedResourceId: validationSchemas.providedResourceId.allow(null),
  tags: tagsValidationSchemas.assignedTagsList.allow(null),
  permissionGroups: permissionGroupsValidationSchemas.assignedPermissionGroupsList.allow(null),
  name: validationSchemas.name.allow(null),
  description: validationSchemas.description.allow(null),
});

export const addClientAssignedTokenJoiSchema = Joi.object()
  .keys({
    workspaceId: validationSchemas.resourceId,
    token: newClientAssignedTokenJoiSchema.required(),
  })
  .required();
