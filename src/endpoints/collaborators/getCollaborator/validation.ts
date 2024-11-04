import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {GetCollaboratorEndpointParams} from './types.js';

export const getCollaboratorJoiSchema =
  startJoiObject<GetCollaboratorEndpointParams>({
    collaboratorId: kValidationSchemas.resourceId.required(),
    workspaceId: kValidationSchemas.resourceId,
  }).required();
