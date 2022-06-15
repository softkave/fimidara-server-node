import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import permissionGroupsValidationSchemas from '../../permissionGroups/validation';
import tagValidationSchemas from '../../tags/validation';

export const updateProgramAccessTokenJoiSchema = Joi.object()
  .keys({
    tokenId: validationSchemas.nanoid.allow(null),
    onReferenced: Joi.boolean().allow(null),
    token: Joi.object()
      .keys({
        name: validationSchemas.name.allow(null),
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
