import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import userValidationSchemas from '../../user/validation';

export const requestJoiSchema = Joi.object().keys({
  recipientEmail: userValidationSchemas.email.required(),
  message: validationSchemas.description,
  expiresAtInSecsFromToday: validationSchemas.fromNowSecs,
});

export const sendRequestJoiSchema = Joi.object()
  .keys({
    organizationId: validationSchemas.nanoid.required(),
    request: requestJoiSchema.required(),
  })
  .required();
