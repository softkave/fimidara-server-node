import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const deleteFolderJoiSchema = Joi.object()
  .keys({
    folderId: validationSchemas.nanoid.required(),
  })
  .required();
