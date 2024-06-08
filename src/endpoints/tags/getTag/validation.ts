import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';

export const getTagJoiSchema = Joi.object()
  .keys({
    tagId: kValidationSchemas.resourceId.required(),
  })
  .required();
