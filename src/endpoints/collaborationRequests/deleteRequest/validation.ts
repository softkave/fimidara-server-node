import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const deleteRequestJoiSchema = Joi.object()
  .keys({
    requestId: validationSchemas.nanoid.required(),
  })
  .required();