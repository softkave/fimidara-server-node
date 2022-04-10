import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const getTagJoiSchema = Joi.object()
  .keys({
    tagId: validationSchemas.nanoid.required(),
  })
  .required();
