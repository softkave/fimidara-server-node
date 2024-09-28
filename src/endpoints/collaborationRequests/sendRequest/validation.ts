import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import userValidationSchemas from '../../users/validation.js';
import {SendCollaborationRequestEndpointParams} from './types.js';

export const sendCollaborationRequestJoiSchema =
  Joi.object<SendCollaborationRequestEndpointParams>()
    .keys({
      workspaceId: kValidationSchemas.resourceId,
      recipientEmail: userValidationSchemas.email.required(),
      message: kValidationSchemas.description.allow(null),
      expires: kValidationSchemas.time.allow(null),
    })
    .required();
