import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {GetWorkspaceEndpointParams} from './types.js';

export const getWorkspaceJoiSchema = startJoiObject<GetWorkspaceEndpointParams>(
  {workspaceId: kValidationSchemas.resourceId}
).required();
