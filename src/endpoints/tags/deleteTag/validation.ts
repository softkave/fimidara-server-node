import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const deleteTagJoiSchema = Joi.object()
  .keys({
    tagId: validationSchemas.resourceId.required(),
  })
  .required();
