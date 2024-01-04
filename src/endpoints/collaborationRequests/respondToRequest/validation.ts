import * as Joi from 'joi';
import {CollaborationRequestStatusTypeMap} from '../../../definitions/collaborationRequest';
import {kValidationSchemas} from '../../../utils/validationUtils';

export const respondToCollaborationRequestJoiSchema = Joi.object()
  .keys({
    requestId: kValidationSchemas.resourceId.required(),
    response: Joi.string()
      .allow(
        CollaborationRequestStatusTypeMap.Accepted,
        CollaborationRequestStatusTypeMap.Declined
      )
      .required(),
  })
  .required();
