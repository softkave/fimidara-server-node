import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import folderValidationSchemas from '../validation';

export const deleteFolderJoiSchema = Joi.object()
  .keys({
    organizationId: validationSchemas.nanoid.allow([null]),
    path: folderValidationSchemas.path.required(),
  })
  .required();
