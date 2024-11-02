import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {GetUserEndpointParams} from './types.js';

export const getUserJoiSchema = startJoiObject<GetUserEndpointParams>({
  userId: kValidationSchemas.resourceId,
  workspaceId: kValidationSchemas.resourceId,
}).required();
