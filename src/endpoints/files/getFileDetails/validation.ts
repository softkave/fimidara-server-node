import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import folderValidationSchemas from '../../folders/validation';

export const getFileDetailsJoiSchema = Joi.object()
  .keys({
    organizationId: validationSchemas.nanoid.allow(null),
    path: folderValidationSchemas.path.required(),
  })
  .required();
