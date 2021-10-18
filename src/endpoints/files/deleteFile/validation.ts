import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const deleteFileJoiSchema = Joi.object()
  .keys({
    fileId: validationSchemas.nanoid.required(),
  })
  .required();
