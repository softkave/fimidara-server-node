import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const getEntityPermissionItemsJoiSchema = Joi.object()
  .keys({
    workspaceId: validationSchemas.resourceId,
    permissionEntityId: validationSchemas.resourceId.required(),
    permissionEntityType: validationSchemas.resourceType.required(),
  })
  .required();
