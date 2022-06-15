import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import tagValidationSchemas from '../../tags/validation';
import permissionGroupsValidationSchemas from '../validation';

export const updatePermissionGroupJoiSchema = Joi.object()
  .keys({
    permissionGroupId: validationSchemas.nanoid.required(),
    permissionGroup: Joi.object()
      .keys({
        name: validationSchemas.name,
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