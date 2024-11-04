import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {EncodeAgentTokenEndpointParams} from './types.js';

export const encodeAgentTokenJoiSchema =
  startJoiObject<EncodeAgentTokenEndpointParams>({
    ...endpointValidationSchemas.workspaceResourceParts,
    tokenId: kValidationSchemas.resourceId,
  }).required();
