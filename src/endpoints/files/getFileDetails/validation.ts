import {startJoiObject} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import fileValidationSchemas from '../validation.js';
import {GetFileDetailsEndpointParams} from './types.js';

export const getFileDetailsJoiSchema =
  startJoiObject<GetFileDetailsEndpointParams>({
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    ...fileValidationSchemas.fileMatcherParts,
  }).required();
