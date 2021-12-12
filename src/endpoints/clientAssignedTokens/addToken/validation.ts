import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const newClientAssignedTokenJoiSchema = Joi.object().keys({
  expires: validationSchemas.fromNowMs,
});

export const addClientAssignedTokenJoiSchema = Joi.object()
  .keys({
    organizationId: validationSchemas.nanoid.required(),
    token: newClientAssignedTokenJoiSchema.required(),
  })
  .required();
