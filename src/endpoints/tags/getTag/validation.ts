import * as Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils';

export const getTagJoiSchema = Joi.object()
  .keys({
    tagId: kValidationSchemas.resourceId.required(),
  })
  .required();
