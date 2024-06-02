import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';

export const updateTagJoiSchema = Joi.object()
  .keys({
    tagId: kValidationSchemas.resourceId.required(),
    tag: Joi.object()
      .keys({
        name: kValidationSchemas.name.allow(null),
        description: kValidationSchemas.description.allow(null),
      })
      .required(),
  })
  .required();
