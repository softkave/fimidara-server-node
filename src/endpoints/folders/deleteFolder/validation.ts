import {startJoiObject} from '../../../utils/validationUtils.js';
import folderValidationSchemas from '../validation.js';
import {DeleteFolderEndpointParams} from './types.js';

export const deleteFolderJoiSchema = startJoiObject<DeleteFolderEndpointParams>(
  folderValidationSchemas.folderMatcherParts
).required();
