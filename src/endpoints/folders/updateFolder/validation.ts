import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import folderValidationSchemas from '../validation.js';
import {UpdateFolderEndpointParams, UpdateFolderInput} from './types.js';

export const updateFolderJoiSchema = startJoiObject<UpdateFolderEndpointParams>(
  {
    ...folderValidationSchemas.folderMatcherParts,
    folder: startJoiObject<UpdateFolderInput>({
      description: kValidationSchemas.description.allow(null),
    }).required(),
  }
).required();
