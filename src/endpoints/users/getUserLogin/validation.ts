import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {GetUserLoginEndpointParams} from './types.js';

export const getUserLoginJoiSchema = startJoiObject<GetUserLoginEndpointParams>(
  {
    userId: kValidationSchemas.resourceId,
    workspaceId: kValidationSchemas.resourceId,
  }
).required();
