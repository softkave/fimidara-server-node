import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const updateRequestInputJoiSchema = Joi.object().keys({
  message: validationSchemas.description.allow([null]),
  expiresAtInSecsFromToday: validationSchemas.fromNowSecs.allow([null]),
});

export const updateRequestJoiSchema = Joi.object()
  .keys({
    requestId: validationSchemas.nanoid.required(),
    request: updateRequestInputJoiSchema.required(),
  })
  .required();
