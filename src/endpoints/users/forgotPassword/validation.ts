import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import userValidationSchemas from '../validation.js';
import {ForgotPasswordEndpointParams} from './types.js';

export const forgotPasswordJoiSchema =
  startJoiObject<ForgotPasswordEndpointParams>({
    workspaceId: kValidationSchemas.resourceId,
    userId: kValidationSchemas.resourceId,
    email: userValidationSchemas.email,
  }).required();
