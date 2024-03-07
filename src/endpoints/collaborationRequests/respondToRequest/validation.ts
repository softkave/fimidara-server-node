import * as Joi from 'joi';
import {kCollaborationRequestStatusTypeMap} from '../../../definitions/collaborationRequest';
import {kValidationSchemas} from '../../../utils/validationUtils';

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
