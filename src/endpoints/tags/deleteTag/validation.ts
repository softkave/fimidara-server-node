import * as Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';

export const deleteTagJoiSchema = Joi.object()
  .keys({
    tagId: kValidationSchemas.resourceId.required(),
  })
  .required();
