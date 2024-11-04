import {startJoiObject} from '../../../utils/validationUtils.js';
import folderValidationSchemas from '../validation.js';
import {GetFolderEndpointParams} from './types.js';

export const getFolderJoiSchema = startJoiObject<GetFolderEndpointParams>(
  folderValidationSchemas.folderMatcherParts
).required();
