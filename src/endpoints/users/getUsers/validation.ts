import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {GetUsersEndpointParams} from './types.js';

export const getUsersJoiSchema = startJoiObject<GetUsersEndpointParams>({
  ...endpointValidationSchemas.paginationParts,
  workspaceId: kValidationSchemas.resourceId,
}).required();
