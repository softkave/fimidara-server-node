import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';

export const getTagJoiSchema = Joi.object()
  .keys({
    tagId: validationSchemas.resourceId.required(),
  })
  .required();
