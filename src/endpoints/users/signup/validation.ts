import {
  startJoiObject,
  kValidationSchemas,
} from '../../../utils/validationUtils.js';
import userValidationSchemas from '../validation.js';
import {SignupEndpointParams} from './types.js';

export const signupJoiSchema = startJoiObject<SignupEndpointParams>({
  workspaceId: kValidationSchemas.resourceId,
  firstName: userValidationSchemas.name.required(),
  lastName: userValidationSchemas.name.required(),
  password: userValidationSchemas.password.required(),
  email: userValidationSchemas.email.required(),
}).required();
