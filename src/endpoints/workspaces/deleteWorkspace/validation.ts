import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {DeleteWorkspaceEndpointParams} from './types.js';

export const deleteWorkspaceJoiSchema =
  startJoiObject<DeleteWorkspaceEndpointParams>({
    workspaceId: kValidationSchemas.resourceId,
  }).required();
