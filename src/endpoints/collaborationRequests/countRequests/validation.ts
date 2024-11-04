import {startJoiObject} from '../../../utils/validationUtils.js';
import {getCollaborationRequestsBaseJoiSchemaParts} from '../getRequests/validation.js';
import {CountCollaborationRequestsEndpointParams} from './types.js';

export const countCollaborationRequestsJoiSchema =
  startJoiObject<CountCollaborationRequestsEndpointParams>(
    getCollaborationRequestsBaseJoiSchemaParts
  ).required();
