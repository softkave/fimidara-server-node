import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import folderValidationSchemas from '../../folders/validation';
import fileValidationSchemas from '../validation';

export const updateFileDetailsJoiSchema = Joi.object()
  .keys({
    organizationId: validationSchemas.nanoid.allow(null),
    path: folderValidationSchemas.path.required(),
    file: Joi.object()
      .keys({
        // name: folderValidationSchemas.name.allow(null),
        description: validationSchemas.description.allow(null),
        mimetype: fileValidationSchemas.mimetype.allow(null),
      })
      .required(),
  })
  .required();
