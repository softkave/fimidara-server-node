import Joi from 'joi';
import {kCollaborationRequestStatusTypeMap} from '../../../definitions/collaborationRequest.js';
import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {RespondToCollaborationRequestEndpointParams} from './types.js';

export const respondToCollaborationRequestJoiSchema =
  startJoiObject<RespondToCollaborationRequestEndpointParams>({
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    requestId: kValidationSchemas.resourceId.required(),
    response: Joi.string()
      .allow(
        kCollaborationRequestStatusTypeMap.Accepted,
        kCollaborationRequestStatusTypeMap.Declined
      )
      .required(),
  }).required();
