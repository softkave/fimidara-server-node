import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import userValidationSchemas from '../../user/validation';
import {CollaborationRequestInput, SendCollaborationRequestEndpointParams} from './types';

export const requestJoiSchema = Joi.object<CollaborationRequestInput>().keys({
  recipientEmail: userValidationSchemas.email.required(),
  message: validationSchemas.description.allow(null),
  expires: validationSchemas.time.allow(null),
  // permissionGroupsOnAccept: permissionGroupsValidationSchemas.assignedPermissionGroupsList.allow(null),
});

export const sendCollaborationRequestJoiSchema =
  Joi.object<SendCollaborationRequestEndpointParams>()
    .keys({
      workspaceId: validationSchemas.resourceId,
      request: requestJoiSchema.required(),
    })
    .required();
