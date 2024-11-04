import {startJoiObject} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import fileValidationSchemas from '../validation.js';
import {DeleteFileEndpointParams} from './types.js';

export const deleteFileJoiSchema = startJoiObject<DeleteFileEndpointParams>({
  ...endpointValidationSchemas.optionalWorkspaceIdParts,
  ...fileValidationSchemas.fileMatcherParts,
}).required();
