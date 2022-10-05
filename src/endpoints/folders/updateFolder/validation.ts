import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import permissionItemValidationSchemas from '../../permissionItems/validation';
import tagValidationSchemas from '../../tags/validation';
import folderValidationSchemas from '../validation';

export const folderInputJoiSchema = Joi.object().keys({
  name: validationSchemas.name,
  description: validationSchemas.description,
});

export const updateFolderJoiSchema = Joi.object()
  .keys({
    ...folderValidationSchemas.folderMatcherParts,
    folder: Joi.object()
      .keys({
        description: validationSchemas.description.allow(null),
        publicAccessOps:
          permissionItemValidationSchemas.publicAccessOpList.allow(null),
        removePublicAccessOps: Joi.boolean().allow(null),
        tags: tagValidationSchemas.assignedTagsList.allow(null),
      })
      .required(),
  })
  .required();
