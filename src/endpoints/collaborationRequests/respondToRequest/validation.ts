import * as Joi from 'joi';
import {CollaborationRequestStatusType} from '../../../definitions/collaborationRequest';
import {validationSchemas} from '../../../utilities/validationUtils';

export const respondToRequestJoiSchema = Joi.object()
  .keys({
    requestId: validationSchemas.nanoid.required(),
    response: Joi.string()
      .allow(
        CollaborationRequestStatusType.Accepted,
        CollaborationRequestStatusType.Declined
      )
      .required(),
  })
  .required();
