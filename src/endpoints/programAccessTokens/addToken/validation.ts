import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import permissionGroupsValidationSchemas from '../../permissionGroups/validation';
import tagValidationSchemas from '../../tags/validation';

export const addProgramAccessTokenJoiSchema = Joi.object()
  .keys({
    workspaceId: validationSchemas.resourceId,
    token: Joi.object()
      .keys({
        name: validationSchemas.name.required(),
        description: validationSchemas.description.allow(null),
        permissionGroups:
          permissionGroupsValidationSchemas.assignedPermissionGroupsList.allow(
            null
          ),
        tags: tagValidationSchemas.assignedTagsList.allow(null),
      })
      .required(),
  })
  .required();
