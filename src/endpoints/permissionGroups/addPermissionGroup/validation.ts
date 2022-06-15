import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import tagValidationSchemas from '../../tags/validation';
import permissionGroupsValidationSchemas from '../validation';

export const addPermissionGroupJoiSchema = Joi.object()
  .keys({
    workspaceId: validationSchemas.nanoid,
    permissionGroup: Joi.object()
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
