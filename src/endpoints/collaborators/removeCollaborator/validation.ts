import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {RemoveCollaboratorEndpointParams} from './types.js';

export const removeCollaboratorJoiSchema =
  startJoiObject<RemoveCollaboratorEndpointParams>({
    workspaceId: kValidationSchemas.resourceId,
    collaboratorId: kValidationSchemas.resourceId.required(),
  }).required();
