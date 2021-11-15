import * as Joi from 'joi';

export const newClientAssignedTokenJoiSchema = Joi.object().keys({});

export const addClientAssignedTokenJoiSchema = Joi.object()
  .keys({
    token: newClientAssignedTokenJoiSchema.required(),
  })
  .required();
