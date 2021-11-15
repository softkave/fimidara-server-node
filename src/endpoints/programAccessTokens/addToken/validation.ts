import * as Joi from 'joi';

export const newProgramAccessTokenJoiSchema = Joi.object().keys({});

export const addProgramAccessTokenJoiSchema = Joi.object()
  .keys({
    token: newProgramAccessTokenJoiSchema.required(),
  })
  .required();
