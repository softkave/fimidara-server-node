import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import userValidationSchemas from '../validation.js';
import {LoginEndpointParams} from './types.js';

export const loginJoiSchema = startJoiObject<LoginEndpointParams>({
  workspaceId: kValidationSchemas.resourceId,
  userId: kValidationSchemas.resourceId,
  email: userValidationSchemas.email,
  password: userValidationSchemas.password.required(),
}).required();
