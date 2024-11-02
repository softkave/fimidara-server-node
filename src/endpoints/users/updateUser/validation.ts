import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import userValidationSchemas from '../validation.js';
import {UpdateUserEndpointParams, UpdateUserInput} from './types.js';

export const updateUserJoiSchema = startJoiObject<UpdateUserEndpointParams>({
  userId: kValidationSchemas.resourceId,
  workspaceId: kValidationSchemas.resourceId,
  user: startJoiObject<UpdateUserInput>({
    firstName: userValidationSchemas.name.allow(null),
    lastName: userValidationSchemas.name.allow(null),
    email: userValidationSchemas.email.allow(null),
  }).required(),
}).required();
