import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const updateRequestInputJoiSchema = Joi.object().keys({
  message: validationSchemas.description.allow(null),
  expires: validationSchemas.time.allow(null),
});

export const updateRequestJoiSchema = Joi.object()
  .keys({
    requestId: validationSchemas.resourceId.required(),
    request: updateRequestInputJoiSchema.required(),
  })
  .required();
