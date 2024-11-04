import {startJoiObject} from '../../../utils/validationUtils.js';
import {getAgentTokenBaseJoiSchemaParts} from '../getTokens/validation.js';
import {CountAgentTokensEndpointParams} from './types.js';

export const countAgentTokenJoiSchema =
  startJoiObject<CountAgentTokensEndpointParams>(
    getAgentTokenBaseJoiSchemaParts
  ).required();
