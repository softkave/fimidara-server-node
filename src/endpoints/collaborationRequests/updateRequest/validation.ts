import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const updateRequestInputJoiSchema = Joi.object().keys({
  //TODO
});

export const updateRequestJoiSchema = Joi.object()
  .keys({
    organization: updateRequestInputJoiSchema.required(),
  })
  .required();
