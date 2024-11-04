import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import fileValidationSchemas from '../validation.js';
import {
  UpdateFileDetailsEndpointParams,
  UpdateFileDetailsInput,
} from './types.js';

export const updateFileDetailsJoiSchema =
  startJoiObject<UpdateFileDetailsEndpointParams>({
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    ...fileValidationSchemas.fileMatcherParts,
    file: startJoiObject<UpdateFileDetailsInput>({
      description: kValidationSchemas.description.allow(null),
      mimetype: fileValidationSchemas.mimetype.allow(null),
    }).required(),
  }).required();
