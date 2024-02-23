import * as Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils';

export const getPermissionGroupJoiSchema = Joi.object()
  .keys({
    permissionGroupId: kValidationSchemas.resourceId.required(),
  })
  .required();
