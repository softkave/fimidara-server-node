import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {DeleteAgentTokenEndpointParams} from './types.js';

export const deleteAgentTokenJoiSchema =
  startJoiObject<DeleteAgentTokenEndpointParams>({
    ...endpointValidationSchemas.workspaceResourceParts,
    tokenId: kValidationSchemas.resourceId,
  }).required();
