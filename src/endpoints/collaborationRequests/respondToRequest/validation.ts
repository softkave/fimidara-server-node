import Joi from 'joi';
import {kCollaborationRequestStatusTypeMap} from '../../../definitions/collaborationRequest.js';
import {kValidationSchemas} from '../../../utils/validationUtils.js';

export const respondToCollaborationRequestJoiSchema = Joi.object()
  .keys({
    requestId: kValidationSchemas.resourceId.required(),
    response: Joi.string()
      .allow(
        kCollaborationRequestStatusTypeMap.Accepted,
        kCollaborationRequestStatusTypeMap.Declined
      )
      .required(),
  })
  .required();
