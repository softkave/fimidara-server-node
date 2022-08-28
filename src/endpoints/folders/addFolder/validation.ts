import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import fileValidationSchemas from '../../files/validation';
import permissionItemValidationSchemas from '../../permissionItems/validation';
import tagValidationSchemas from '../../tags/validation';
import folderValidationSchemas from '../validation';

export const addFolderJoiSchema = Joi.object()
  .keys({
    folder: Joi.object()
      .keys({
        folderpath: folderValidationSchemas.folderpath.required(),
        description: validationSchemas.description.allow(null),
        maxFileSizeInBytes: fileValidationSchemas.fileSizeInBytes.allow(null),
        publicAccessOps:
          permissionItemValidationSchemas.publicAccessOpList.allow(null),
        tags: tagValidationSchemas.assignedTagsList.allow(null),
      })
      .required(),
  })
  .required();
