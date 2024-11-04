import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import userValidationSchemas from '../../users/validation.js';
import {SendCollaborationRequestEndpointParams} from './types.js';

export const sendCollaborationRequestJoiSchema =
  startJoiObject<SendCollaborationRequestEndpointParams>({
    workspaceId: kValidationSchemas.resourceId,
    recipientEmail: userValidationSchemas.email.required(),
    message: kValidationSchemas.description.allow(null),
    expires: kValidationSchemas.time.allow(null),
  }).required();
