import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';

export const deleteTagJoiSchema = Joi.object()
  .keys({
    tagId: validationSchemas.resourceId.required(),
  })
  .required();
