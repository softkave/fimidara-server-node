import * as Joi from 'joi';
import {CollaborationRequestStatusType} from '../../../definitions/collaborationRequest';
import {validationSchemas} from '../../../utils/validationUtils';

export const respondToCollaborationRequestJoiSchema = Joi.object()
  .keys({
    requestId: validationSchemas.resourceId.required(),
    response: Joi.string()
      .allow(CollaborationRequestStatusType.Accepted, CollaborationRequestStatusType.Declined)
      .required(),
  })
  .required();
