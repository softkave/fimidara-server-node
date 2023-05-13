import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import userValidationSchemas from '../../users/validation';
import {CollaborationRequestInput, SendCollaborationRequestEndpointParams} from './types';

export const requestJoiSchema = Joi.object<CollaborationRequestInput>().keys({
  recipientEmail: userValidationSchemas.email.required(),
  message: validationSchemas.description.allow(null),
  expires: validationSchemas.time.allow(null),
});

export const sendCollaborationRequestJoiSchema =
  Joi.object<SendCollaborationRequestEndpointParams>()
    .keys({
      workspaceId: validationSchemas.resourceId,
      request: requestJoiSchema.required(),
    })
    .required();
