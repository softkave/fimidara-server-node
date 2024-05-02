import * as Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import userValidationSchemas from '../../users/validation.js';
import {CollaborationRequestInput, SendCollaborationRequestEndpointParams} from './types.js';

export const requestJoiSchema = Joi.object<CollaborationRequestInput>().keys({
  recipientEmail: userValidationSchemas.email.required(),
  message: kValidationSchemas.description.allow(null),
  expires: kValidationSchemas.time.allow(null),
});

export const sendCollaborationRequestJoiSchema =
  Joi.object<SendCollaborationRequestEndpointParams>()
    .keys({
      workspaceId: kValidationSchemas.resourceId,
      request: requestJoiSchema.required(),
    })
    .required();
