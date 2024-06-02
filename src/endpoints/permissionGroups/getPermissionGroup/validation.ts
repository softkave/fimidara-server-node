import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';

export const getPermissionGroupJoiSchema = Joi.object()
  .keys({
    permissionGroupId: kValidationSchemas.resourceId.required(),
  })
  .required();
