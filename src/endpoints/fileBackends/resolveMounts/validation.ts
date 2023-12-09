import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import fileValidationSchemas from '../../files/validation';
import folderValidationSchemas from '../../folders/validation';
import {endpointValidationSchemas} from '../../validation';
import {ResolveFileBackendMountsEndpointParams} from './types';

export const resolveWorkspaceFileBackendMountJoiSchema =
  Joi.object<ResolveFileBackendMountsEndpointParams>()
    .keys({
      ...endpointValidationSchemas.optionalWorkspaceIdParts,
      folderpath: folderValidationSchemas.folderpath,
      filepath: fileValidationSchemas.fileMatcherParts.filepath,
      folderId: validationSchemas.resourceId,
      fileId: fileValidationSchemas.fileMatcherParts.fileId,
    })
    .required();
