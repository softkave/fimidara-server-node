import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';

export const getEntityPermissionItemsJoiSchema = Joi.object()
  .keys({
    workspaceId: validationSchemas.resourceId,
    permissionEntityId: validationSchemas.resourceId.required(),
    permissionEntityType: validationSchemas.resourceType.required(),
  })
  .required();
