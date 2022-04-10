import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import tagValidationSchemas from '../../tags/validation';
import fileValidationSchemas from '../validation';

export const updateFileDetailsJoiSchema = Joi.object()
  .keys({
    ...fileValidationSchemas.fileMatcherParts,
    file: Joi.object()
      .keys({
        description: validationSchemas.description.allow(null),
        mimetype: fileValidationSchemas.mimetype.allow(null),
        publicAccessAction:
          fileValidationSchemas.publicAccessAction.allow(null),
        tags: tagValidationSchemas.assignedTagsList.allow(null),
      })
      .required(),
  })
  .required();
