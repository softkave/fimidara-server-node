import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import fileValidationSchemas from '../../files/validation';
import folderValidationSchemas from '../validation';

export const addFolderJoiSchema = Joi.object()
  .keys({
    organizationId: validationSchemas.nanoid.required(),
    folder: Joi.object()
      .keys({
        folderpath: folderValidationSchemas.folderpath.required(),
        description: validationSchemas.description.allow(null),
        maxFileSizeInBytes: fileValidationSchemas.fileSizeInBytes.allow(null),
        publicAccessOps: validationSchemas.publicAccessOpList.allow(null),
      })
      .required(),
  })
  .required();
