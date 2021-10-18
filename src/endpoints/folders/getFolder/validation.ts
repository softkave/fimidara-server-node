import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const getFolderJoiSchema = Joi.object()
  .keys({
    folderId: validationSchemas.nanoid.required(),
  })
  .required();
