import * as Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils';
import userValidationSchemas from '../../users/validation';
import {CollaborationRequestInput, SendCollaborationRequestEndpointParams} from './types';

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
