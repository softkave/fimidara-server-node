import * as Joi from 'joi';

export const newBucketJoiSchema = Joi.object().keys({});

export const addBucketJoiSchema = Joi.object()
  .keys({
    bucket: newBucketJoiSchema.required(),
  })
  .required();
