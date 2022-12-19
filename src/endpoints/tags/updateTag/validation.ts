import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';

export const updateTagJoiSchema = Joi.object()
  .keys({
    tagId: validationSchemas.resourceId.required(),
    tag: Joi.object()
      .keys({
        name: validationSchemas.name.allow(null),
        description: validationSchemas.description.allow(null),
      })
      .required(),
  })
  .required();
