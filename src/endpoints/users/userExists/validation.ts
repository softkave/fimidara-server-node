import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import userValidationSchemas from '../validation.js';
import {UserExistsEndpointParams} from './types.js';

export const userExistsJoiSchema = startJoiObject<UserExistsEndpointParams>({
  email: userValidationSchemas.email.required(),
  workspaceId: kValidationSchemas.resourceId,
}).required();
