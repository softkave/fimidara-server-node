import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import fileValidationSchemas from '../../files/validation.js';
import folderValidationSchemas from '../../folders/validation.js';
import {endpointValidationSchemas} from '../../validation.js';
import {ResolveFileBackendMountsEndpointParams} from './types.js';

export const resolveWorkspaceFileBackendMountJoiSchema =
  Joi.object<ResolveFileBackendMountsEndpointParams>()
    .keys({
      ...endpointValidationSchemas.optionalWorkspaceIdParts,
      folderpath: folderValidationSchemas.folderpath,
      filepath: fileValidationSchemas.fileMatcherParts.filepath,
      folderId: kValidationSchemas.resourceId,
      fileId: fileValidationSchemas.fileMatcherParts.fileId,
    })
    .required();
