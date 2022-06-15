import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const getPermissionGroupJoiSchema = Joi.object()
  .keys({
    permissionGroupId: validationSchemas.nanoid.required(),
  })
  .required();