import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {
  UpdateCollaborationRequestEndpointParams,
  UpdateCollaborationRequestInput,
} from './types.js';

export const updateCollaborationRequestInputJoiSchema =
  startJoiObject<UpdateCollaborationRequestInput>({
    message: kValidationSchemas.description.allow(null),
    expires: kValidationSchemas.time.allow(null),
    // permissionGroupsOnAccept:
    //   permissionGroupsValidationSchemas.assignedPermissionGroupsList.allow(null),
  });

export const updateCollaborationRequestJoiSchema =
  startJoiObject<UpdateCollaborationRequestEndpointParams>({
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    requestId: kValidationSchemas.resourceId.required(),
    request: updateCollaborationRequestInputJoiSchema.required(),
  }).required();
