import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import folderValidationSchemas from '../validation.js';
import {AddFolderEndpointParams} from './types.js';

export const addFolderJoiSchema = startJoiObject<AddFolderEndpointParams>({
  ...endpointValidationSchemas.optionalWorkspaceIdParts,
  folderpath: folderValidationSchemas.folderpath.required(),
  description: kValidationSchemas.description.allow(null),
}).required();
