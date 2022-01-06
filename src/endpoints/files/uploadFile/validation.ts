import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import folderValidationSchemas from '../../folders/validation';
import fileValidationSchemas from '../validation';

export const uploadFileJoiSchema = Joi.object()
  .keys({
    organizationId: validationSchemas.nanoid.allow([null]),
    file: Joi.object()
      .keys({
        path: folderValidationSchemas.path.required(),
        description: validationSchemas.description.allow([null]),
        mimetype: fileValidationSchemas.mimetype.allow([null]),
        encoding: fileValidationSchemas.encoding.allow([null]),
        data: fileValidationSchemas.buffer.required(),
      })
      .required(),
  })
  .required();
