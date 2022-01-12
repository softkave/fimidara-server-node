import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import userValidationSchemas from '../../user/validation';

export const requestJoiSchema = Joi.object().keys({
  recipientEmail: userValidationSchemas.email.required(),
  message: validationSchemas.description.allow(null),
  expires: validationSchemas.fromNowSecs.allow(null),
});

export const sendRequestJoiSchema = Joi.object()
  .keys({
    organizationId: validationSchemas.nanoid.required(),
    request: requestJoiSchema.required(),
  })
  .required();
