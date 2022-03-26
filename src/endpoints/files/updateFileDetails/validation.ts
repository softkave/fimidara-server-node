import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import fileValidationSchemas from '../validation';

export const updateFileDetailsJoiSchema = Joi.object()
  .keys({
    ...fileValidationSchemas.fileMatcherParts,
    file: Joi.object()
      .keys({
        // name: folderValidationSchemas.name.allow(null),
        description: validationSchemas.description.allow(null),
        mimetype: fileValidationSchemas.mimetype.allow(null),
      })
      .required(),
  })
  .required();
