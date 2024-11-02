import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import userValidationSchemas from '../validation.js';
import {ChangePasswordEndpointParams} from './types.js';

export const changePasswordJoiSchema =
  startJoiObject<ChangePasswordEndpointParams>({
    password: userValidationSchemas.password.required(),
    workspaceId: kValidationSchemas.resourceId,
    currentPassword: userValidationSchemas.password,
    userId: kValidationSchemas.resourceId,
  }).required();
