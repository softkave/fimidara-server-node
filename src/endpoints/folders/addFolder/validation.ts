import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import fileValidationSchemas from '../../files/validation';
import tagValidationSchemas from '../../tags/validation';
import folderValidationSchemas from '../validation';

export const addFolderJoiSchema = Joi.object()
  .keys({
    workspaceId: validationSchemas.nanoid,
    folder: Joi.object()
      .keys({
        folderpath: folderValidationSchemas.folderpath.required(),
        description: validationSchemas.description.allow(null),
        maxFileSizeInBytes: fileValidationSchemas.fileSizeInBytes.allow(null),
        publicAccessOps: validationSchemas.publicAccessOpList.allow(null),
        tags: tagValidationSchemas.assignedTagsList.allow(null),
      })
      .required(),
  })
  .required();
