import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';

export const getPermissionGroupJoiSchema = Joi.object()
  .keys({
    permissionGroupId: validationSchemas.resourceId.required(),
  })
  .required();
