import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const getFileDetailsJoiSchema = Joi.object()
  .keys({
    organizationId: validationSchemas.nanoid.required(),
  })
  .required();
