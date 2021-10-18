import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const getFileJoiSchema = Joi.object()
  .keys({
    fileId: validationSchemas.nanoid.required(),
  })
  .required();
